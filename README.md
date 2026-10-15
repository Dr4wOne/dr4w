# dr4w

A personal platform that takes an idea to a live product at `<name>.dr4w.io` with almost no idle cost.
Each project is a React app on a Cloudflare Worker that proxies `/api/*` to one Hono Lambda on AWS.
One monorepo, shared infrastructure modules, and Claude slash commands for the idea → launch pipeline.

## Prerequisites
Node 24, pnpm 12, Docker, Git, GitHub CLI. For cloud work also OpenTofu 1.13 and AWS CLI ≥ 2.9.
Exact versions: `docs/stack.md`. Install steps: `docs/setup-new-machine.md`.

## Quick start (local, no cloud access needed)
```bash
gh repo clone Dr4wOne/dr4w && cd dr4w
pnpm install
pnpm run doctor           # checks tools and access
pnpm dev hello            # http://localhost:5173
```

## Daily commands
| Command | What it does |
|---|---|
| `pnpm dev [project…]` | Run projects offline (dynamodb-local + API + Worker/Vite); no args = pick |
| `pnpm dev:cloud <project>` | Same, but the API uses the project's **real** AWS resources (SSO profile `dr4w`) |
| `pnpm new <name>` | Scaffold `apps/<name>/` from `templates/project/` |
| `pnpm check` | Lint + project contract + typecheck + test + build |
| `pnpm infra:check` | `tofu fmt` + `validate` for every stack (offline) |
| `pnpm check:projects` | Validate `project.json` files and `uses`/`exposes` links |
| `pnpm docs:check` | Broken links, missing project docs, stale `docs/STATUS.md` |
| `pnpm run doctor` | Tool versions, Docker, AWS SSO, GitHub login |
| `pnpm ideas` | The idea board |
| `pnpm seed <project>` | Create a project's tables in dynamodb-local |
| `pnpm format` | Fix formatting (Biome) |

Deploy = merge a PR to `main` (`docs/guides/deploy.md`).

## Idea pipeline (Claude slash commands)
| Command | Result |
|---|---|
| `/idea <one-liner>` | `ideas/<slug>/00-idea.md` |
| `/refine <slug>` | ≤ 7 questions, then keep or drop |
| `/spec <slug>` | `01-spec.md`: stories, endpoints, data, infra from the module catalog |
| `/plan <slug>` | `02-tasks.md`: tasks ≤ 1 h, each with its test |
| `/poc <slug>` | Scaffold + implementation; `pnpm dev` works |
| `/launch <slug>` | Checklist + PR; merging deploys |
| `/endpoint <project> <METHOD /path>` | Route + schema + test |
| `/resource <project> <table\|queue\|bucket\|cron\|event>` | Module block + wiring |
| `/start` · `/handoff` · `/where <topic>` · `/doc-check` | Session protocol (`CLAUDE.md`) |

## Where is…?
| Looking for | Go to |
|---|---|
| Current state, known issues | `docs/STATUS.md` |
| Every doc, by task | `docs/README.md` |
| How it works | `docs/architecture.md` |
| Why it's built this way | `docs/decisions/` |
| A file or folder | `docs/repo-map.md` |
| Rules and patterns | `docs/conventions.md`, `docs/dos-and-donts.md` |
| Costs, security | `docs/costs.md`, `docs/security.md` |
| Something broke | `docs/troubleshooting.md`, `docs/guides/debugging-prod.md` |
| Infra building blocks | `infra/modules/README.md` |

## Live projects
| Project | URL | Status |
|---|---|---|
| hello | https://hello.dr4w.io | live — notes, publishes `Note.Created.v1` |
| echo | https://echo.dr4w.io | live — counts hello's notes via `dr4w-bus` |

Status of everything else: `docs/STATUS.md`.
