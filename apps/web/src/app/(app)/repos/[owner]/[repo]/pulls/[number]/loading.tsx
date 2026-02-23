export default function PRDetailLoading() {
	return (
		<div className="animate-pulse">
			{/* PR title + action buttons */}
			<div className="flex items-start justify-between gap-4 mb-3">
				<div className="flex items-center gap-2 min-w-0">
					<div className="h-5 w-[420px] rounded bg-muted/40" />
					<div className="h-5 w-8 rounded bg-muted/20" />
				</div>
				<div className="flex items-center gap-2 shrink-0">
					<div className="h-8 w-24 rounded-md bg-muted/20 border border-border/40" />
					<div className="h-8 w-28 rounded-md bg-muted/25 border border-border/40" />
					<div className="h-8 w-6 rounded bg-muted/15" />
					<div className="h-8 w-20 rounded-md bg-muted/20 border border-border/40" />
				</div>
			</div>

			{/* Meta row: status badge, avatar, author, time, branch, stats, checks */}
			<div className="flex items-center gap-2.5 mb-4 flex-wrap">
				<div className="h-5 w-16 rounded-full bg-green-500/15" />
				<div className="h-5 w-5 rounded-full bg-muted/40" />
				<div className="h-3.5 w-20 rounded bg-muted/30" />
				<div className="h-3 w-12 rounded bg-muted/15" />
				<div className="h-3 w-px bg-border/40 mx-0.5" />
				{/* Branch info */}
				<div className="flex items-center gap-1.5">
					<div className="h-4 w-4 rounded bg-muted/20" />
					<div className="h-3.5 w-48 rounded bg-muted/20" />
					<div className="h-3 w-3 rounded bg-muted/15" />
					<div className="h-3.5 w-12 rounded bg-muted/20" />
				</div>
				<div className="h-3 w-px bg-border/40 mx-0.5" />
				{/* Stats */}
				<div className="h-3.5 w-20 rounded bg-muted/15" />
				<div className="h-3.5 w-12 rounded bg-muted/15" />
				<div className="h-3 w-px bg-border/40 mx-0.5" />
				{/* Checks */}
				<div className="h-4 w-4 rounded-full bg-muted/25" />
				<div className="h-3.5 w-8 rounded bg-muted/15" />
				<div className="h-3 w-px bg-border/40 mx-0.5" />
				<div className="h-3.5 w-16 rounded bg-muted/15" />
				<div className="h-4 w-4 rounded bg-muted/15" />
			</div>

			{/* Main split: file sidebar + diff viewer */}
			<div className="flex gap-0 border border-border rounded-md overflow-hidden min-h-[600px]">
				{/* Left: file list sidebar */}
				<div className="w-[260px] shrink-0 border-r border-border">
					{/* File list header */}
					<div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
						<div className="h-3.5 w-14 rounded bg-muted/30" />
						<div className="h-3 w-16 rounded bg-muted/15" />
						<div className="flex items-center gap-1.5 ml-auto">
							<div className="h-5 w-5 rounded bg-muted/20" />
							<div className="h-5 w-5 rounded bg-muted/20" />
							<div className="h-5 w-5 rounded bg-muted/20" />
						</div>
					</div>
					{/* File entries */}
					{[
						{ nameW: 140, pathW: 100, add: 37, del: 1 },
						{ nameW: 80, pathW: 70, add: 118, del: 32 },
					].map((file, i) => (
						<div
							key={i}
							className="flex flex-col gap-1 px-3 py-2.5 border-b border-border/30 hover:bg-muted/10"
						>
							<div className="flex items-center gap-2">
								<div className="h-3.5 w-3.5 rounded bg-muted/25 shrink-0" />
								<div
									className="h-3.5 rounded bg-muted/30"
									style={{
										width: file.nameW,
									}}
								/>
								<div className="flex items-center gap-1 ml-auto shrink-0">
									<div className="h-3 w-10 rounded bg-green-500/15" />
									<div className="h-3 w-6 rounded bg-red-500/15" />
								</div>
							</div>
							<div
								className="h-2.5 rounded bg-muted/15 ml-5"
								style={{ width: file.pathW }}
							/>
						</div>
					))}
				</div>

				{/* Right: diff viewer */}
				<div className="flex-1 min-w-0">
					{/* Diff file header bar */}
					<div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/10 sticky top-0">
						<div className="h-4 w-4 rounded bg-muted/25" />
						<div className="h-3.5 w-3.5 rounded bg-muted/20" />
						<div className="h-3.5 w-64 rounded bg-muted/25" />
						<div className="flex items-center gap-2 ml-auto">
							<div className="h-3 w-10 rounded bg-green-500/15" />
							<div className="h-3 w-8 rounded bg-red-500/15" />
							<div className="flex items-center gap-1.5 ml-3">
								<div className="h-5 w-5 rounded bg-muted/15" />
								<div className="h-5 w-5 rounded bg-muted/15" />
								<div className="h-5 w-5 rounded bg-muted/15" />
								<div className="h-5 w-5 rounded bg-muted/15" />
							</div>
							<div className="h-3.5 w-20 rounded bg-muted/15 ml-2" />
							<div className="flex items-center gap-1 ml-2">
								<div className="h-3.5 w-8 rounded bg-muted/15" />
								<div className="h-4 w-4 rounded bg-muted/15" />
								<div className="h-4 w-4 rounded bg-muted/15" />
							</div>
						</div>
					</div>

					{/* Hunk header */}
					<div className="flex items-center h-7 bg-blue-500/5 border-b border-border/20">
						<div className="w-[88px] shrink-0" />
						<div className="h-3 w-96 rounded bg-blue-500/10 ml-2" />
					</div>

					{/* Diff lines */}
					{[
						{ type: "ctx" },
						{ type: "ctx" },
						{ type: "ctx" },
						{ type: "del" },
						{ type: "add" },
						{ type: "add" },
						{ type: "ctx" },
						{ type: "ctx" },
						{ type: "add" },
						{ type: "add" },
						{ type: "add" },
						{ type: "add" },
						{ type: "ctx" },
						{ type: "ctx" },
						{ type: "del" },
						{ type: "del" },
						{ type: "add" },
						{ type: "add" },
						{ type: "add" },
						{ type: "ctx" },
						{ type: "ctx" },
						{ type: "ctx" },
						{ type: "add" },
						{ type: "add" },
						{ type: "add" },
						{ type: "add" },
						{ type: "add" },
						{ type: "ctx" },
						{ type: "ctx" },
						{ type: "add" },
						{ type: "add" },
						{ type: "ctx" },
					].map((line, i) => (
						<div
							key={i}
							className={`flex items-center h-[22px] border-b border-transparent ${
								line.type === "add"
									? "bg-green-500/[0.04]"
									: line.type === "del"
										? "bg-red-500/[0.04]"
										: ""
							}`}
						>
							{/* Line numbers */}
							<div className="w-11 shrink-0 flex justify-end pr-1.5">
								<div className="h-2.5 w-5 rounded bg-muted/10" />
							</div>
							<div className="w-11 shrink-0 flex justify-end pr-1.5 border-r border-border/20">
								<div className="h-2.5 w-5 rounded bg-muted/10" />
							</div>
							{/* +/- indicator */}
							<div className="w-5 shrink-0 flex justify-center">
								{line.type === "add" && (
									<div className="h-2.5 w-2 rounded-sm bg-green-500/15" />
								)}
								{line.type === "del" && (
									<div className="h-2.5 w-2 rounded-sm bg-red-500/15" />
								)}
							</div>
							{/* Code content */}
							<div
								className={`h-3 rounded ${
									line.type === "add"
										? "bg-green-500/10"
										: line.type ===
											  "del"
											? "bg-red-500/10"
											: "bg-muted/15"
								}`}
								style={{
									width: `${[180, 280, 340, 220, 420, 160, 300, 260, 380, 200, 140, 320, 240, 360, 190, 270, 310, 400, 170, 250, 290, 350, 210, 230, 370, 330, 150, 280, 390, 260, 200, 340][i % 32]}px`,
									marginLeft: `${[16, 16, 24, 16, 24, 32, 24, 16, 16, 24, 32, 24, 16, 16, 24, 16, 24, 32, 16, 24, 16, 24, 32, 24, 16, 24, 16, 16, 24, 32, 16, 24][i % 32]}px`,
								}}
							/>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
