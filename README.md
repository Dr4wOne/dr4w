# dr4w

A personal platform that takes an idea to a live product at `<name>.dr4w.io` with almost no idle cost.
Each project is a React app on a Cloudflare Worker that proxies `/api/*` to one Hono Lambda on AWS.
One monorepo, shared infrastructure modules, and Claude slash commands for the idea → launch pipeline.

**Live:** [hello.dr4w.io](https://hello.dr4w.io) (notes) · [echo.dr4w.io](https://echo.dr4w.io) (counts hello's notes) — current state in [docs/STATUS.md](docs/STATUS.md).

## Start here
| If you want to… | Read, in this order |
|---|---|
| Understand the setup from zero | [Handbook](docs/handbook/README.md): [1 What is dr4w](docs/handbook/01-what-is-dr4w.md) → [2 The big picture](docs/handbook/02-the-big-picture.md) → [4 Journey of a request](docs/handbook/04-request-journey.md) |
| Run it on your laptop | [Set up a new machine](docs/setup-new-machine.md) → [Local development](docs/guides/local-dev.md) |
| Ship a change today | [Tutorial A](docs/handbook/13-tutorials.md) → [Deploy](docs/guides/deploy.md) |
| Review the architecture | [Architecture](docs/architecture.md) → [Decisions](docs/decisions/README.md) → [Why this stack](docs/handbook/14-why-this-stack.md) |
| Find any doc by task | [Docs index](docs/README.md) |

## The setup in one minute
| Layer | What it is | Where |
|---|---|---|
| Projects | One folder per app: web (React + Worker), api (Hono Lambda), infra (OpenTofu), `project.json` | [apps/](apps/) — e.g. [apps/hello](apps/hello/README.md) |
| Shared code | Schemas and events, API helpers, typed web client | [packages/contracts](packages/contracts/src/), [packages/api-kit](packages/api-kit/src/), [packages/web-kit](packages/web-kit/src/) |
| Infra building blocks | Lambda + API, tables, queues, buckets, cron, events, project links | [infra/modules](infra/modules/README.md) |
| Shared cloud resources | Event bus, alerts, budget (platform); state bucket and CI roles (bootstrap) | [infra/platform](infra/platform/), [infra/bootstrap](infra/bootstrap/) |
| CI/CD | PR checks + plan, deploy on merge, platform, destroy | [.github/workflows](.github/workflows/) — explained in [Shipping and running](docs/handbook/11-shipping-and-running.md) |
| New-project template | What `pnpm new` copies | [templates/project](templates/project/) |
| Ideas | Idea → spec → plan documents | [ideas/](ideas/README.md) |
| Agent setup | Claude rules, slash commands, plugins | [CLAUDE.md](CLAUDE.md), [.claude/commands](.claude/commands/), [docs/agent-tools.md](docs/agent-tools.md) |

Every folder in detail: [docs/repo-map.md](docs/repo-map.md).

## Prerequisites
Node 24, pnpm 12, Docker, Git, GitHub CLI. For cloud work also OpenTofu 1.13 and AWS CLI ≥ 2.9.
Exact versions: [docs/stack.md](docs/stack.md). Install steps: [docs/setup-new-machine.md](docs/setup-new-machine.md).

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
| `pnpm check` | Lint + project contract + docs + typecheck + test + build |
| `pnpm infra:check` | `tofu fmt` + `validate` for every stack (offline) |
| `pnpm check:projects` | Validate `project.json` files and `uses`/`exposes` links |
| `pnpm docs:check` | Broken links, missing project docs, stale `docs/STATUS.md` |
| `pnpm docs:diagrams` | Render every Mermaid diagram in `docs/` |
| `pnpm run doctor` | Tool versions, Docker, AWS SSO, GitHub login, agent plugins |
| `pnpm ideas` | The idea board |
| `pnpm seed <project>` | Create a project's tables in dynamodb-local |
| `pnpm format` | Fix formatting (Biome) |

Deploy = merge a PR to `main` ([docs/guides/deploy.md](docs/guides/deploy.md)).

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
| `/start` · `/handoff` · `/where <topic>` · `/doc-check` | Session protocol ([CLAUDE.md](CLAUDE.md)) |

How the pipeline works: [Handbook ch. 12](docs/handbook/12-idea-pipeline-and-ai.md) · [docs/guides/new-idea.md](docs/guides/new-idea.md).

## Where is…?
| Looking for | Go to |
|---|---|
| Current state, known issues | [docs/STATUS.md](docs/STATUS.md) |
| Every doc, by task | [docs/README.md](docs/README.md) |
| How it works | [docs/architecture.md](docs/architecture.md) · [Handbook](docs/handbook/README.md) |
| Why it's built this way | [docs/decisions/](docs/decisions/README.md) |
| A file or folder | [docs/repo-map.md](docs/repo-map.md) |
| Rules and patterns | [docs/conventions.md](docs/conventions.md) · [docs/dos-and-donts.md](docs/dos-and-donts.md) |
| Costs, security | [docs/costs.md](docs/costs.md) · [docs/security.md](docs/security.md) |
| Something broke | [docs/troubleshooting.md](docs/troubleshooting.md) · [docs/guides/debugging-prod.md](docs/guides/debugging-prod.md) |
| How-to guides | [docs/guides/](docs/guides/) |
| Agent plugins (caveman, ponytail) | [docs/agent-tools.md](docs/agent-tools.md) |
