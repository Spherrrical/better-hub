"use server";

import {
	getOctokit,
	getGitHubToken,
	getAuthenticatedUser,
	invalidatePullRequestCache,
	getRepoBranches,
} from "@/lib/github";
import { computeContributorScore } from "@/lib/contributor-score";
import { getErrorMessage } from "@/lib/utils";
import { revalidatePath } from "next/cache";

type PRMutationScope = "detail" | "list" | "layout";

const PR_ACTION_SCOPES: Record<string, PRMutationScope[]> = {
	merge: ["detail", "list", "layout"],
	close: ["detail", "list", "layout"],
	reopen: ["detail", "list", "layout"],
	rename: ["detail", "list"],
	updateBase: ["detail", "list"],
	review: ["detail"],
	comment: ["detail"],
	reviewComment: ["detail"],
	suggestion: ["detail"],
	fileCommit: ["detail"],
	resolveThread: ["detail"],
	unresolveThread: ["detail"],
	conflictResolution: ["detail", "list"],
};

async function revalidateAfterPRMutation(
	owner: string,
	repo: string,
	pullNumber: number,
	action: keyof typeof PR_ACTION_SCOPES,
) {
	const scopes = PR_ACTION_SCOPES[action] ?? ["detail"];
	await invalidatePullRequestCache(owner, repo, pullNumber);
	if (scopes.includes("detail")) {
		revalidatePath(`/repos/${owner}/${repo}/pulls/${pullNumber}`);
	}
	if (scopes.includes("list")) {
		revalidatePath(`/repos/${owner}/${repo}/pulls`);
	}
	if (scopes.includes("layout")) {
		revalidatePath(`/repos/${owner}/${repo}`, "layout");
	}
}

export async function fetchBranchNames(owner: string, repo: string) {
	try {
		const branches = await getRepoBranches(owner, repo);
		return (branches || []).map((b: { name: string }) => b.name);
	} catch {
		return [];
	}
}

export async function updatePRBaseBranch(
	owner: string,
	repo: string,
	pullNumber: number,
	base: string,
) {
	const octokit = await getOctokit();
	if (!octokit) return { error: "Not authenticated" };

	try {
		await octokit.pulls.update({
			owner,
			repo,
			pull_number: pullNumber,
			base,
		});
		await revalidateAfterPRMutation(owner, repo, pullNumber, "updateBase");
		return { success: true };
	} catch (e: unknown) {
		return { error: getErrorMessage(e) || "Failed to update base branch" };
	}
}

export async function renamePullRequest(
	owner: string,
	repo: string,
	pullNumber: number,
	title: string,
) {
	const octokit = await getOctokit();
	if (!octokit) return { error: "Not authenticated" };

	try {
		await octokit.pulls.update({
			owner,
			repo,
			pull_number: pullNumber,
			title,
		});
		await revalidateAfterPRMutation(owner, repo, pullNumber, "rename");
		return { success: true };
	} catch (e: unknown) {
		return { error: getErrorMessage(e) || "Failed to rename" };
	}
}

export type MergeMethod = "merge" | "squash" | "rebase";

export async function mergePullRequest(
	owner: string,
	repo: string,
	pullNumber: number,
	method: MergeMethod,
	commitTitle?: string,
	commitMessage?: string,
) {
	const octokit = await getOctokit();
	if (!octokit) return { error: "Not authenticated" };

	try {
		await octokit.pulls.merge({
			owner,
			repo,
			pull_number: pullNumber,
			merge_method: method,
			...(commitTitle ? { commit_title: commitTitle } : {}),
			...(commitMessage ? { commit_message: commitMessage } : {}),
		});
		await revalidateAfterPRMutation(owner, repo, pullNumber, "merge");
		return { success: true };
	} catch (e: unknown) {
		return { error: getErrorMessage(e) || "Failed to merge" };
	}
}

export async function closePullRequest(owner: string, repo: string, pullNumber: number) {
	const octokit = await getOctokit();
	if (!octokit) return { error: "Not authenticated" };

	try {
		await octokit.pulls.update({
			owner,
			repo,
			pull_number: pullNumber,
			state: "closed",
		});
		await revalidateAfterPRMutation(owner, repo, pullNumber, "close");
		return { success: true };
	} catch (e: unknown) {
		return { error: getErrorMessage(e) || "Failed to close" };
	}
}

export async function reopenPullRequest(owner: string, repo: string, pullNumber: number) {
	const octokit = await getOctokit();
	if (!octokit) return { error: "Not authenticated" };

	try {
		await octokit.pulls.update({
			owner,
			repo,
			pull_number: pullNumber,
			state: "open",
		});
		await revalidateAfterPRMutation(owner, repo, pullNumber, "reopen");
		return { success: true };
	} catch (e: unknown) {
		return { error: getErrorMessage(e) || "Failed to reopen" };
	}
}

export type ReviewEvent = "APPROVE" | "REQUEST_CHANGES" | "COMMENT";

export async function submitPRReview(
	owner: string,
	repo: string,
	pullNumber: number,
	event: ReviewEvent,
	body?: string,
) {
	const octokit = await getOctokit();
	if (!octokit) return { error: "Not authenticated" };

	try {
		await octokit.pulls.createReview({
			owner,
			repo,
			pull_number: pullNumber,
			event,
			...(body ? { body } : {}),
		});
		await revalidateAfterPRMutation(owner, repo, pullNumber, "review");
		return { success: true };
	} catch (e: unknown) {
		return { error: getErrorMessage(e) || "Failed to submit review" };
	}
}

export async function addPRComment(owner: string, repo: string, pullNumber: number, body: string) {
	const octokit = await getOctokit();
	if (!octokit) return { error: "Not authenticated" };

	try {
		await octokit.issues.createComment({
			owner,
			repo,
			issue_number: pullNumber,
			body,
		});
		await revalidateAfterPRMutation(owner, repo, pullNumber, "comment");
		return { success: true };
	} catch (e: unknown) {
		return { error: getErrorMessage(e) || "Failed to add comment" };
	}
}

export async function addPRReviewComment(
	owner: string,
	repo: string,
	pullNumber: number,
	body: string,
	commitId: string,
	path: string,
	line: number,
	side: "LEFT" | "RIGHT",
	startLine?: number,
	startSide?: "LEFT" | "RIGHT",
) {
	const octokit = await getOctokit();
	if (!octokit) return { error: "Not authenticated" };

	try {
		const params: Parameters<typeof octokit.pulls.createReviewComment>[0] = {
			owner,
			repo,
			pull_number: pullNumber,
			body,
			commit_id: commitId,
			path,
			line,
			side,
		};
		if (startLine !== undefined && startLine !== line) {
			params.start_line = startLine;
			params.start_side = startSide || side;
		}
		await octokit.pulls.createReviewComment(params);
		await revalidateAfterPRMutation(owner, repo, pullNumber, "reviewComment");
		return { success: true };
	} catch (e: unknown) {
		return { error: getErrorMessage(e) || "Failed to add review comment" };
	}
}

export async function commitSuggestion(
	owner: string,
	repo: string,
	pullNumber: number,
	path: string,
	branch: string,
	startLine: number,
	endLine: number,
	suggestion: string,
	commitMessage?: string,
) {
	const octokit = await getOctokit();
	if (!octokit) return { error: "Not authenticated" };

	try {
		const { data: fileData } = await octokit.repos.getContent({
			owner,
			repo,
			path,
			ref: branch,
		});

		if (Array.isArray(fileData) || fileData.type !== "file") {
			return { error: "Not a file" };
		}

		const content = Buffer.from(
			(fileData as { content: string }).content,
			"base64",
		).toString("utf-8");
		const lines = content.split("\n");

		// Replace lines (1-indexed)
		const before = lines.slice(0, startLine - 1);
		const after = lines.slice(endLine);
		const suggestionLines = suggestion.length > 0 ? suggestion.split("\n") : [];
		const newContent = [...before, ...suggestionLines, ...after].join("\n");

		await octokit.repos.createOrUpdateFileContents({
			owner,
			repo,
			path,
			message:
				commitMessage ||
				`Apply suggestion to ${path} (lines ${startLine}-${endLine})`,
			content: Buffer.from(newContent).toString("base64"),
			sha: (fileData as { sha: string }).sha,
			branch,
		});

		await revalidateAfterPRMutation(owner, repo, pullNumber, "suggestion");
		return { success: true };
	} catch (e: unknown) {
		return { error: getErrorMessage(e) || "Failed to commit suggestion" };
	}
}

export async function commitFileEditOnPR(
	owner: string,
	repo: string,
	pullNumber: number,
	path: string,
	branch: string,
	content: string,
	sha: string,
	commitMessage: string,
) {
	const octokit = await getOctokit();
	if (!octokit) return { error: "Not authenticated" };

	try {
		const { data } = await octokit.repos.createOrUpdateFileContents({
			owner,
			repo,
			path,
			message: commitMessage,
			content: Buffer.from(content).toString("base64"),
			sha,
			branch,
		});
		await revalidateAfterPRMutation(owner, repo, pullNumber, "fileCommit");
		return { success: true, newSha: data.content?.sha };
	} catch (e: unknown) {
		return { error: getErrorMessage(e) || "Failed to commit file edit" };
	}
}

export async function resolveReviewThread(
	threadId: string,
	owner: string,
	repo: string,
	pullNumber: number,
) {
	const token = await getGitHubToken();
	if (!token) return { error: "Not authenticated" };

	try {
		const response = await fetch("https://api.github.com/graphql", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				query: `mutation($threadId: ID!) {
          resolveReviewThread(input: { threadId: $threadId }) {
            thread { id isResolved }
          }
        }`,
				variables: { threadId },
			}),
		});
		const json = await response.json();
		if (json.errors?.length) {
			return { error: json.errors[0].message };
		}
		await revalidateAfterPRMutation(owner, repo, pullNumber, "resolveThread");
		return { success: true };
	} catch (e: unknown) {
		return { error: getErrorMessage(e) || "Failed to resolve thread" };
	}
}

export async function unresolveReviewThread(
	threadId: string,
	owner: string,
	repo: string,
	pullNumber: number,
) {
	const token = await getGitHubToken();
	if (!token) return { error: "Not authenticated" };

	try {
		const response = await fetch("https://api.github.com/graphql", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				query: `mutation($threadId: ID!) {
          unresolveReviewThread(input: { threadId: $threadId }) {
            thread { id isResolved }
          }
        }`,
				variables: { threadId },
			}),
		});
		const json = await response.json();
		if (json.errors?.length) {
			return { error: json.errors[0].message };
		}
		await revalidateAfterPRMutation(owner, repo, pullNumber, "unresolveThread");
		return { success: true };
	} catch (e: unknown) {
		return { error: getErrorMessage(e) || "Failed to unresolve thread" };
	}
}

export async function commitMergeConflictResolution(
	owner: string,
	repo: string,
	pullNumber: number,
	headBranch: string,
	baseBranch: string,
	resolvedFiles: { path: string; content: string }[],
	commitMessage?: string,
) {
	const octokit = await getOctokit();
	if (!octokit) return { error: "Not authenticated" };

	try {
		// 1. Get HEAD SHAs of both branches
		const [headRef, baseRef] = await Promise.all([
			octokit.git.getRef({ owner, repo, ref: `heads/${headBranch}` }),
			octokit.git.getRef({ owner, repo, ref: `heads/${baseBranch}` }),
		]);
		const headSha = headRef.data.object.sha;
		const baseSha = baseRef.data.object.sha;

		// 2. Get head commit's tree as base
		const { data: headCommit } = await octokit.git.getCommit({
			owner,
			repo,
			commit_sha: headSha,
		});

		// 3. Create blobs for resolved files
		const treeEntries = await Promise.all(
			resolvedFiles.map(async (file) => {
				const { data: blob } = await octokit.git.createBlob({
					owner,
					repo,
					content: Buffer.from(file.content).toString("base64"),
					encoding: "base64",
				});
				return {
					path: file.path,
					mode: "100644" as const,
					type: "blob" as const,
					sha: blob.sha,
				};
			}),
		);

		// 4. Create new tree based on head's tree
		const { data: newTree } = await octokit.git.createTree({
			owner,
			repo,
			base_tree: headCommit.tree.sha,
			tree: treeEntries,
		});

		// 5. Create merge commit with two parents: [headSha, baseSha]
		const message = commitMessage || `Merge branch '${baseBranch}' into ${headBranch}`;
		const user = await getAuthenticatedUser();
		const { data: mergeCommit } = await octokit.git.createCommit({
			owner,
			repo,
			message,
			tree: newTree.sha,
			parents: [headSha, baseSha],
			...(user
				? {
						author: {
							name:
								(
									user as {
										name?: string;
										login?: string;
									}
								).name ||
								(user as { login?: string })
									.login ||
								"User",
							email:
								(user as { email?: string })
									.email ||
								`${(user as { login?: string }).login}@users.noreply.github.com`,
							date: new Date().toISOString(),
						},
					}
				: {}),
		});

		// 6. Update head branch ref to point to merge commit
		await octokit.git.updateRef({
			owner,
			repo,
			ref: `heads/${headBranch}`,
			sha: mergeCommit.sha,
		});

		await revalidateAfterPRMutation(owner, repo, pullNumber, "conflictResolution");
		return { success: true, mergeCommitSha: mergeCommit.sha };
	} catch (e: unknown) {
		return { error: getErrorMessage(e) || "Failed to commit merge resolution" };
	}
}

/* eslint-disable @typescript-eslint/no-explicit-any */
async function fetchAuthorDossierGraphQL(
	token: string,
	owner: string,
	repo: string,
	authorLogin: string,
) {
	const slug = `${owner}/${repo}`;
	const query = `
		query($login: String!) {
			user(login: $login) {
				login
				name
				avatarUrl
				bio
				company
				location
				websiteUrl
				twitterUsername
				repositories { totalCount }
				followers { totalCount }
				following { totalCount }
				createdAt
				__typename
				topRepositories(first: 6, orderBy: {field: STARGAZERS, direction: DESC}) {
					nodes { name nameWithOwner stargazerCount primaryLanguage { name } }
				}
				organizations(first: 10) {
					nodes { login avatarUrl }
				}
			}
			openPrs: search(query: "repo:${slug} author:${authorLogin} type:pr is:open", type: ISSUE, first: 0) { issueCount }
			mergedPrs: search(query: "repo:${slug} author:${authorLogin} type:pr is:merged", type: ISSUE, first: 0) { issueCount }
			closedPrs: search(query: "repo:${slug} author:${authorLogin} type:pr is:unmerged is:closed", type: ISSUE, first: 0) { issueCount }
			issues: search(query: "repo:${slug} author:${authorLogin} type:issue", type: ISSUE, first: 0) { issueCount }
			reviews: search(query: "repo:${slug} reviewed-by:${authorLogin} type:pr", type: ISSUE, first: 0) { issueCount }
		}
	`;

	const response = await fetch("https://api.github.com/graphql", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ query, variables: { login: authorLogin } }),
		signal: AbortSignal.timeout(8_000),
	});

	if (!response.ok) return null;
	const json = await response.json();
	const u = json.data?.user;
	if (!u) return null;

	const orgs: { login: string; avatar_url: string }[] =
		(u.organizations?.nodes ?? []).map((o: any) => ({
			login: o.login,
			avatar_url: o.avatarUrl,
		}));
	const topRepos = (u.topRepositories?.nodes ?? []).map((r: any) => ({
		name: r.name,
		full_name: r.nameWithOwner,
		stargazers_count: r.stargazerCount ?? 0,
		language: r.primaryLanguage?.name ?? null,
	}));
	const isOrgMember = orgs.some(
		(o) => o.login?.toLowerCase() === owner.toLowerCase(),
	);

	const openPrs = json.data?.openPrs?.issueCount ?? 0;
	const mergedPrs = json.data?.mergedPrs?.issueCount ?? 0;
	const closedPrs = json.data?.closedPrs?.issueCount ?? 0;
	const totalPrs = openPrs + mergedPrs + closedPrs;
	const issueCount = json.data?.issues?.issueCount ?? 0;
	const reviewCount = json.data?.reviews?.issueCount ?? 0;

	const prsInRepo: { state: string }[] = [
		...Array(mergedPrs).fill({ state: "merged" }),
		...Array(closedPrs).fill({ state: "closed" }),
		...Array(openPrs).fill({ state: "open" }),
	];

	const contributionCount = mergedPrs + reviewCount;
	const isContributor = contributionCount > 0;

	const score = computeContributorScore({
		followers: u.followers?.totalCount ?? 0,
		publicRepos: u.repositories?.totalCount ?? 0,
		accountCreated: u.createdAt ?? "",
		commitsInRepo: mergedPrs,
		prsInRepo,
		reviewsInRepo: reviewCount,
		isContributor,
		contributionCount,
		isOrgMember,
		isOwner: authorLogin.toLowerCase() === owner.toLowerCase(),
		topRepoStars: topRepos.map((r: any) => r.stargazers_count),
	});

	return {
		author: {
			login: u.login,
			name: u.name,
			avatar_url: u.avatarUrl,
			bio: u.bio,
			company: u.company,
			location: u.location,
			blog: u.websiteUrl,
			twitter_username: u.twitterUsername,
			public_repos: u.repositories?.totalCount ?? 0,
			followers: u.followers?.totalCount ?? 0,
			following: u.following?.totalCount ?? 0,
			created_at: u.createdAt,
			type: u.__typename === "Bot" ? "Bot" : "User",
		},
		orgs,
		topRepos: topRepos.slice(0, 3),
		isOrgMember,
		score,
		contributionCount,
		repoActivity: {
			commits: mergedPrs,
			prs: totalPrs,
			reviews: reviewCount,
			issues: issueCount,
		},
	};
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function fetchAuthorDossier(
	owner: string,
	repo: string,
	authorLogin: string,
) {
	try {
		const token = await getGitHubToken();
		if (!token) return null;
		return await fetchAuthorDossierGraphQL(token, owner, repo, authorLogin);
	} catch (e) {
		console.error("[fetchAuthorDossier] failed:", e);
		return null;
	}
}
