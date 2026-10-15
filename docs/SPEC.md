# SDD Prompt — dr4w Idea-to-Launch Platform

> **Amendments agreed during Specify/Plan (2026-10-14)** — these override the text below:
> - **GitHub:** repo `Dr4wOne/dr4w`, **public** (org is on GitHub Free; environments/branch protection need a public repo). Deploy role trusts `environment:production`; the environment has no required reviewers (auto-deploy on merge).
> - **Region** `us-east-1`; alerts and budget email `dr4wone@gmail.com`.
> - **Root `dr4w.io`** is owned by `Dr4wOne/dr4w-landpage`; this platform only uses subdomains. A "live projects" page is a later idea.
> - **`project.json` gains `exposes`**: `{ "<consumer>": ["table:read" | "table:write" | "bucket:read" | "queue:send" | "events"] }`. `project-ref`/`event-subscription` only grant what is listed.
> - **Lambda reserved concurrency** is a module variable defaulting to `null` (AWS rejects reservations leaving < 100 unreserved); set to 10 once the account quota allows.
> - See `docs/architecture.md` §10 for the full decision log.

---

## 0. How you (Claude) must work

You are building a personal product platform using **Spec-Driven Development**. Work in phases and **stop for my approval at every checkpoint (⏸)**. Never skip a checkpoint.

1. **Specify** — restate requirements in your own words, list any ambiguity you still see (max 5 questions). ⏸
2. **Plan** — produce `docs/architecture.md` (diagram + decisions) and `docs/tasks.md` (ordered, small, checkable tasks grouped by milestone). ⏸
3. **Implement** — one milestone at a time. After each milestone: run lint, typecheck, tests, `tofu validate`, and show me what changed. ⏸
4. **Deploy** — only after I confirm the manual setup steps in §11 are done. Never run `apply`/`deploy` against my accounts without my explicit "go".

Rules:
- The decisions in §2 are **locked**. If you think one is wrong, say so once with reasons, then follow my answer.
- Prefer boring, well-documented tools. No tool that requires a paid plan.
- Never commit secrets, account IDs in plain config are OK, tokens are not.
- Before using any tool/library version, check the current docs (versions change); pin versions in lockfiles.
- Keep every file small and obvious. A future me (or a future Claude session) must understand any project by reading its `README.md` and `project.json`.

---

## 1. Goal

A single, cheap, reusable platform on my notebook that takes me from **idea → refined spec → local POC → launched product** with minimal friction.

| Requirement | What it means concretely |
|---|---|
| Easy to refine ideas | Ideas live as markdown in the repo, with Claude slash commands that move them through stages |
| Easy to run | `pnpm dev` runs any project fully offline (frontend + API + DB) |
| Easy to deploy | `git push` to `main` deploys. No manual console clicks after bootstrap |
| Cheap | Idle cost of a project ≈ $0. Whole platform idle < $5/month (excluding optional Postgres) |
| Reusable infra | Projects compose shared Terraform modules; no copy-paste infra |
| Easy new endpoints | Adding an endpoint = adding one route file + a test |
| Easy new infra | Adding a table/queue/bucket/cron = one module block in the project's infra |
| Connect projects | Documented contract (SSM parameters + shared event bus) for one project to use another |
| Secure | No long-lived cloud keys anywhere; least-privilege CI; secrets in managed stores |

**Non-goals (v1):** end-user auth/login, multi-region, Kubernetes/containers, SSR frameworks, multiple AWS accounts, paid observability tools.

---

## 2. Locked decisions

| Area | Decision | Why |
|---|---|---|
| Repo model | **One monorepo** (`dr4w`) with `apps/<project>/` per project | Solo dev: one CI, shared modules, cross-project wiring is trivial. A project can be extracted later |
| Package manager | **pnpm workspaces** + Turborepo for task caching | Fast, standard |
| Language | **TypeScript everywhere** (web, api, scripts) | One language, shared types |
| Frontend | **Vite + React SPA**, deployed as **Cloudflare Workers with Static Assets** via `wrangler` | Cloudflare now recommends Workers+Static Assets over Pages for new projects; free tier is enough |
| Frontend ↔ API | The project's Worker serves the SPA **and proxies `/api/*` to AWS** | Same origin → no CORS, no extra DNS/certs, AWS URL never used directly by browsers |
| Backend | **One Lambda per project ("lambdalith") running Hono**, behind **API Gateway HTTP API** | Adding an endpoint is a route, not infra. Hono also runs locally on Node |
| Runtime | Lambda Node.js (latest LTS runtime Lambda supports), **arm64**, bundled with esbuild | Cheapest/fastest |
| Default database | **DynamoDB on-demand**, one table per project | True $0 idle |
| Optional relational DB | **One shared Aurora Serverless v2 PostgreSQL cluster**, min capacity **0 ACU (auto-pause)**, **Data API enabled**, one database per project. **Off by default** (`enable_shared_postgres = false`) | Only pay storage when idle; Data API means Lambdas don't need a VPC/NAT. Resume after pause takes seconds → acceptable for side projects |
| IaC | **OpenTofu** (Terraform-compatible), S3 backend with native lockfile (no DynamoDB lock table) | Stable, multi-provider, long-term maintainable. (Considered SST v3: nicer DX, but its development has slowed; not a safe base for a long-lived platform) |
| Cloudflare config | `wrangler.jsonc` per project (custom domain set there). No Cloudflare Terraform provider in v1 | Fewer moving parts; wrangler creates the DNS record for Worker custom domains |
| Secrets | **SSM Parameter Store SecureString** (free tier) for AWS; `wrangler secret` for Workers | Secrets Manager costs per secret/month |
| Cross-project contract | SSM params at `/dr4w/<project>/<env>/<key>` + shared **EventBridge bus** `dr4w-bus` | Read config sync, integrate async |
| AWS auth (laptop) | **IAM Identity Center (SSO) profile** `dr4w` | No access keys on disk |
| AWS auth (CI) | **GitHub OIDC** → two IAM roles (plan / deploy) | No long-lived keys in GitHub |
| Region | `us-east-1` default, single variable to change (`sa-east-1` if users are mostly in Brazil, slightly more expensive) | Cheapest region; Cloudflare edge hides most latency for static assets |
| Environments | `prod` per project. Optional ephemeral `pr-<n>` previews in milestone M5 | Keep it simple first |
| Tests | Vitest (unit + API route tests with Hono `app.request`), Playwright smoke test against deployed URL | Cheap and fast |

---

## 3. Architecture

```
Browser ──► <project>.dr4w.io  (Cloudflare Worker + Static Assets)
               │   static SPA files
               └── /api/*  ──proxy + X-Origin-Secret header──►  API Gateway HTTP API
                                                                     │
                                                              Lambda (Hono app)
                                                    ┌────────────────┼──────────────────┐
                                               DynamoDB table   SSM params        EventBridge dr4w-bus
                                                                (config/secrets)   (cross-project events)
                                               (optional) Aurora PG via Data API

Platform (shared, deployed once):
  tfstate S3 bucket · GitHub OIDC provider + roles · dr4w-bus · budget alarm
  · alerts SNS topic (email) · optional shared Aurora PG cluster
```

Security of the proxy: the Worker adds header `X-Origin-Secret` (value stored as a wrangler secret and in SSM). A Hono middleware rejects requests without it (constant-time compare), except `GET /api/health`. API Gateway has default throttling set (e.g. rate 50, burst 100) to cap cost from abuse.

---

## 4. Repository layout

```
dr4w/
├── CLAUDE.md                     # conventions for future Claude sessions (short!)
├── README.md                     # how to use the platform in 5 minutes
├── .claude/commands/             # idea pipeline slash commands (see §5)
├── ideas/<slug>/                 # idea → spec → plan docs, one folder per idea
├── apps/<project>/
│   ├── project.json              # manifest: name, subdomain, db, uses[], status
│   ├── README.md
│   ├── web/                      # Vite React SPA + worker.ts (proxy) + wrangler.jsonc
│   ├── api/                      # Hono app: src/routes/*.ts, src/app.ts, src/lambda.ts, src/local.ts
│   └── infra/                    # main.tf calling ../../../infra/modules/*, backend.tf, tables.json
├── packages/
│   ├── contracts/                # zod schemas + event types shared by web/api/projects
│   ├── api-kit/                  # Hono middlewares: origin secret, errors, logging, validation
│   └── web-kit/                  # typed API client helper (Hono RPC `hc`), small UI basics
├── infra/
│   ├── bootstrap/                # one-time: state bucket, OIDC provider, CI roles (run locally once)
│   ├── platform/                 # shared resources (bus, budget, alerts, optional PG)
│   └── modules/
│       ├── project-api/          # Lambda + HTTP API + log group (14d) + alarms + SSM outputs
│       ├── dynamo-table/
│       ├── queue/                # SQS + DLQ + Lambda consumer
│       ├── cron/                 # EventBridge Scheduler → Lambda
│       ├── bucket/               # private S3 bucket
│       ├── event-subscription/   # rule on dr4w-bus → Lambda/queue
│       ├── pg-database/          # database + user in the shared cluster
│       └── project-ref/          # read another project's SSM outputs
├── templates/project/            # what `pnpm new` copies
├── scripts/                      # new-project, dev, ideas-status, secrets helpers
├── docker-compose.yml            # dynamodb-local, postgres (profile: pg)
└── .github/workflows/            # ci.yml, deploy.yml, platform.yml, (preview.yml in M5)
```

`project.json` example:
```json
{
  "name": "notes",
  "subdomain": "notes",
  "db": "dynamo",
  "uses": [],
  "status": "live"
}
```

---

## 5. Idea → launch workflow (the core UX)

Each stage is a Claude slash command in `.claude/commands/`. Each writes markdown into `ideas/<slug>/` and updates `status` in its frontmatter.

| Command | Input | Output | Status after |
|---|---|---|---|
| `/idea <one-liner>` | rough idea | `00-idea.md`: problem, user, why now, riskiest assumption, smallest test | `idea` |
| `/refine <slug>` | idea doc | Claude interviews me (≤7 questions), rewrites idea, kills or keeps it | `refined` / `dropped` |
| `/spec <slug>` | refined idea | `01-spec.md`: user stories, acceptance criteria, endpoints, data model, out-of-scope, infra needed (from module catalog only) | `specified` |
| `/plan <slug>` | spec | `02-tasks.md`: ordered tasks, each ≤1h, with test per task | `planned` |
| `/poc <slug>` | tasks | runs `pnpm new <slug>` (or adds to an existing project), implements tasks locally, `pnpm dev` works | `poc` |
| `/launch <slug>` | working POC | checklist (tests green, secrets set, `project.json` ok), opens PR; merge deploys | `live` |
| `/endpoint <project> <METHOD /path>` | — | route file + zod schema in contracts + test | — |
| `/resource <project> <table\|queue\|bucket\|cron\|event>` | — | adds module block + wiring + local equivalent | — |

`pnpm ideas` prints a table of all ideas and their status. A feature for an existing project uses the same flow, with the spec pointing to the target project.

---

## 6. Infrastructure details

### 6.1 Bootstrap (`infra/bootstrap`, local state, run once by me)
- S3 bucket `dr4w-tfstate-<account_id>`: versioned, SSE, public access blocked, TLS-only policy.
- GitHub OIDC identity provider.
- Role `dr4w-ci-plan`: trusted for `repo:<owner>/dr4w:pull_request` and branches; ReadOnlyAccess + state read/lockfile write.
- Role `dr4w-ci-deploy`: trusted **only** for `repo:<owner>/dr4w:environment:production`. Policy limited to the services the modules use, on resources named `dr4w-*`; any IAM role it creates must carry permissions boundary `dr4w-boundary` (enforced by policy condition).
- After apply, migrate bootstrap state into the bucket.

### 6.2 Platform (`infra/platform`, state key `platform/terraform.tfstate`)
- EventBridge bus `dr4w-bus` + archive (7 days).
- SNS topic `dr4w-alerts` with my email subscription.
- AWS Budget: monthly $10, alerts at 50/80/100% → email.
- Optional (`enable_shared_postgres`): Aurora Serverless v2 PostgreSQL, min 0 / max 2 ACU, auto-pause 5 min, Data API on, default VPC, deletion protection on, 7-day backups.
- Writes its outputs to SSM under `/dr4w/platform/*`.

### 6.3 Project stack (`apps/<p>/infra`, state key `projects/<p>/prod/terraform.tfstate`)
- Always: `project-api` module. Optional modules per `project.json`/spec.
- Every module writes its useful outputs to `/dr4w/<project>/<env>/<key>` (e.g. `api_url`, `table_name`).
- Table key schema lives once in `tables.json`, read by OpenTofu (`jsondecode`) and by the local seed script — no drift.
- Lambda env vars get resource names; IAM permissions are generated per module (least privilege, no wildcards on actions).
- Log retention 14 days; alarm on Lambda errors and API 5xx → `dr4w-alerts`.
- Tags on everything: `project`, `env`, `managed-by=opentofu`.

### 6.4 Connecting projects
- **Sync (config/URLs):** `module "billing" { source = ".../project-ref" project = "billing" }` reads SSM outputs; grants read access to that project's declared resources only if the provider project lists the consumer in its `project.json` `exposes` field.
- **Async (preferred):** publish to `dr4w-bus` with `source = "dr4w.<project>"`, `detail-type = "<Entity>.<Event>.v1"`. Event schemas live in `packages/contracts/events`. Consumers use `event-subscription` module.
- Document this with a working example between two template projects (see §9).

---

## 7. CI/CD (GitHub Actions)

- `ci.yml` (every PR): install (cached), lint, typecheck, unit tests, build, `tofu fmt -check`, `tofu validate`, `tofu plan` for **changed projects only** (detect via paths) using `dr4w-ci-plan`; post plan summary as PR comment.
- `deploy.yml` (push to `main`, GitHub environment `production`): for each changed project, in order: `tofu apply` → build & publish Lambda (part of apply) → read `api_url` from outputs → `wrangler deploy` with it as a var → Playwright smoke test against `https://<subdomain>.dr4w.io/api/health`.
- `platform.yml`: manual `workflow_dispatch` for `infra/platform`.
- Changed-project detection: a script that maps changed paths to `apps/*`, and marks **all** projects changed when `packages/` or `infra/modules/` change.
- Concurrency group per project; no parallel applies on the same state.
- Pin third-party actions to commit SHAs. Dependabot for npm, actions, and OpenTofu providers.
- GitHub secrets (environment `production`): `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`. AWS uses OIDC only — **no AWS secrets in GitHub**.

---

## 8. Local development

- `pnpm dev` (root, interactive pick) or `pnpm --filter <project> dev`:
  - `docker compose up dynamodb-local` (and `postgres` if project uses PG), seed tables from `tables.json`;
  - API: `src/local.ts` runs the same Hono app on Node with hot reload on port 8787+n;
  - Web: Vite dev server proxies `/api` to the local API.
- Same code path locally and in Lambda; only the adapter differs (`hono/aws-lambda` vs `@hono/node-server`).
- `.env.local` per project (git-ignored), generated from `.env.example`.
- Optional `pnpm dev:cloud <project>`: run the local API against the real deployed AWS resources using my SSO profile (for debugging).
- Works on macOS/Linux; on Windows require WSL2.

---

## 9. Milestones & acceptance criteria

**M1 — Skeleton & local dev**
- Monorepo, packages, template, `pnpm new <name>` scaffolds a working project.
- Sample project `hello`: `GET /api/health`, CRUD `/api/notes` (DynamoDB), a page that lists/creates notes.
- `pnpm dev` works fully offline; tests pass. ⏸

**M2 — Bootstrap & platform** (needs §11 done)
- `infra/bootstrap` and `infra/platform` code + a step-by-step `docs/bootstrap.md`. I run bootstrap; you run platform with my "go". ⏸

**M3 — First deploy**
- `hello` live at `https://hello.dr4w.io` via the deploy workflow. Smoke test green. Direct calls to the execute-api URL without the secret header return 403. ⏸

**M4 — Second project + connection**
- `pnpm new echo` creates a second project that subscribes to `Note.Created.v1` from `hello` via `dr4w-bus` and stores a counter. Proves cross-project contract. ⏸

**M5 — Idea pipeline + polish**
- All slash commands in §5, `pnpm ideas`, `CLAUDE.md`, root `README.md`, `docs/runbook.md` (rollback = re-run deploy on previous commit, or `wrangler rollback` for frontend; how to destroy a project; how to rotate the origin secret and Cloudflare token).
- Optional: PR preview environments (`pr-<n>` stacks + Worker preview URLs, destroyed on PR close). ⏸

**Definition of done (whole platform):**
- New project from zero to live in **< 15 minutes** with: `/idea` → `/spec` → `/plan` → `/poc` → `/launch`.
- New endpoint in **< 5 minutes** (`/endpoint`).
- Idle monthly AWS cost of `hello` + `echo` + platform ≈ $0–2 (Postgres disabled), verified via Cost Explorer after 1 week.
- No AWS access keys exist anywhere (laptop or GitHub).

---

## 10. Cost guardrails (must be enforced in modules)
- On-demand / pay-per-request everything; no NAT gateways, no ALBs, no provisioned capacity, no VPC Lambdas.
- Log retention ≤ 14 days; no CloudWatch dashboards (they cost money) — use the free metrics views.
- Budget alarm from day 1.
- API Gateway throttling and Lambda reserved concurrency (e.g. 10) per project by default.
- Aurora only when explicitly enabled; document that it costs storage even when paused.

---

## 11. Manual steps I (the human) do — Claude writes the exact instructions in `docs/bootstrap.md`
1. AWS: enable IAM Identity Center, create my admin user + permission set, `aws configure sso --profile dr4w`. Enable MFA on root and lock root away.
2. Cloudflare: confirm `dr4w.io` zone is active; create an API token scoped to **this account + zone dr4w.io** with: Workers Scripts Edit, Workers Routes Edit, Zone DNS Edit, Account Settings Read. Copy account ID.
3. GitHub: create repo `dr4w` (private), create environment `production` (optionally require my approval), add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as environment secrets.
4. Run `infra/bootstrap` once locally with my SSO profile.
5. Confirm the SNS email subscription.

---

## 12. Things to confirm with me before Plan (answered — see amendments at top)
1. GitHub owner/org name for the OIDC trust policy.
2. Region: `us-east-1` or `sa-east-1`?
3. Alert email address.
4. Should the root `dr4w.io` show anything (e.g. a list of live projects), or stay untouched?
5. Require manual approval on the `production` environment, or auto-deploy on merge?
