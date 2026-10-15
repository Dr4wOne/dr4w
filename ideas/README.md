# Ideas

One folder per idea: `ideas/<slug>/`. Claude slash commands move it through the stages and keep
`status` in `00-idea.md`'s frontmatter up to date. `pnpm ideas` prints the board.

| Stage | Command | Writes | Status after |
|---|---|---|---|
| Capture | `/idea <one-liner>` | `00-idea.md` | `idea` |
| Sharpen | `/refine <slug>` | rewrites `00-idea.md` | `refined` or `dropped` |
| Specify | `/spec <slug>` | `01-spec.md` | `specified` |
| Plan | `/plan <slug>` | `02-tasks.md` | `planned` |
| Build | `/poc <slug>` | code in `apps/<project>/` | `poc` |
| Ship | `/launch <slug>` | PR; merge deploys | `live` |

`/refine` is optional for small ideas. A feature for an existing project uses the same flow;
set `project:` in the frontmatter to that project.
