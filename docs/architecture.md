# dr4w — Architecture

Personal idea-to-launch platform. One monorepo, many small projects, ~$0 idle cost.
Source of truth for requirements: `docs/SPEC.md`. This file records **how** and **why**.

## 1. Big picture

```
                         ┌──────────────── Cloudflare (free) ────────────────┐
Browser ──► https://<sub>.dr4w.io ──► Worker "dr4w-<p>" (Static Assets = SPA)│
                         │                 │ /api/*                          │
                         └─────────────────┼──────────────────────────────────┘
                                           │ fetch(API_ORIGIN + path)
                                           │ + X-Origin-Secret (wrangler secret)
                         ┌──────────────── AWS us-east-1 ─────────────────────┐
                         │  API Gateway HTTP API  (throttle 50 rps / burst 100) │
                         │        │                                            │
                         │  Lambda dr4w-<p>-prod-api  (Hono, nodejs, arm64)    │
                         │   ├─ originSecret middleware (SSM, cached)          │
                         │   ├─ DynamoDB dr4w-<p>-prod (on-demand)             │
                         │   ├─ SSM /dr4w/<p>/prod/*                           │
                         │   ├─ PutEvents → EventBridge dr4w-bus               │
                         │   └─ (opt) Aurora PG via RDS Data API               │
                         │                                                     │
                         │  Platform (once): tfstate bucket · OIDC + CI roles  │
                         │  · dr4w-boundary · dr4w-bus (+7d archive)           │
                         │  · SNS dr4w-alerts · Budget $10 · (opt) Aurora PG   │
                         └─────────────────────────────────────────────────────┘

GitHub Actions (Dr4wOne/dr4w, public) ──OIDC──► dr4w-ci-plan   (PRs: plan only)
                                       ──OIDC──► dr4w-ci-deploy (env production: apply)
                               ──token─► Cloudflare (wrangler deploy)
```

`dr4w.io` apex belongs to the separate repo `Dr4wOne/dr4w-landpage`. This platform only ever
creates `<subdomain>.dr4w.io` Worker custom domains and must never touch the apex or `www`.

## 2. Request path & proxy security

1. Browser calls `/api/notes` on its own origin → no CORS anywhere.
2. Worker (`web/worker.ts`) forwards `/api/*` to `env.API_ORIGIN` (wrangler var, set at deploy
   from the tofu output `api_url`), adds `X-Origin-Secret: env.ORIGIN_SECRET`, strips any
   incoming `X-Origin-Secret` from the client. Everything else → `env.ASSETS` (SPA fallback).
3. Lambda: `api-kit` `originSecret()` middleware does a constant-time compare
   (`crypto.timingSafeEqual`) against the secret; mismatch → `403`. `GET /api/health` is exempt.
4. The secret is a `random_password` in the project stack → SSM SecureString
   `/dr4w/<p>/prod/origin_secret`. Lambda reads it once per cold start (env holds only the
   parameter **name**). Deploy workflow reads it from tofu output and pushes it with wrangler.

Accepted trade-offs: the secret is in tofu state (encrypted bucket, CI roles only); a rejected
request still invokes Lambda (cost capped by API GW throttling).

## 3. Repository layout

As in SPEC §4. Additions/clarifications:

| Path | Purpose |
|---|---|
| `apps/<p>/project.json` | `name, subdomain, db, uses[], exposes{}, status, ports{web,api}` |
| `apps/<p>/infra/tables.json` | DynamoDB key schema + GSIs; read by tofu (`jsondecode`) and `scripts/seed.ts` |
| `scripts/changed-projects.ts` | git diff → JSON list of projects for CI matrices |
| `scripts/new-project.ts` | `pnpm new <name>`: copy `templates/project`, replace tokens, assign ports |
| `infra/modules/_shared/` | not a module — conventions doc for naming/tags (README only) |

### `project.json`
```json
{
  "name": "hello",
  "subdomain": "hello",
  "db": "dynamo",
  "uses": [],
  "exposes": { "echo": ["events"] },
  "status": "live",
  "ports": { "web": 5173, "api": 8787 }
}
```
`exposes` grant vocabulary (closed list, validated by a zod schema in `scripts/`):
`table:read`, `table:write`, `bucket:read`, `queue:send`, `events`.

## 4. Backend code shape

```
apps/<p>/api/src/
  app.ts          // new Hono().basePath('/api').use(kit middlewares).route('/notes', notes) …
  routes/notes.ts // export const notes = new Hono().get(…).post(…)   (chained → RPC types)
  routes/*.test.ts// app.request('/api/notes', …) against dynamodb-local
  lambda.ts       // export const handler = handle(app)          (hono/aws-lambda)
  local.ts        // serve({ fetch: app.fetch, port })           (@hono/node-server)
  env.ts          // zod-parsed process.env (TABLE_NAME, BUS_NAME, …)
```

**Endpoint = one route file + one `.route()` line + one test.** We deliberately keep the explicit
mount line (no filesystem auto-registration) because Hono RPC types (`hc<AppType>`) need the
chained app type; `/endpoint` adds the line for you.

`packages/api-kit`: `originSecret()`, `errorHandler` (zod → 400, unknown → 500 + log),
`requestLogger` (JSON lines, request id), `validate()` (re-export of `@hono/zod-validator`),
`ddb` (DocumentClient factory honoring `DYNAMO_ENDPOINT` for local), `publish(event)` (typed
PutEvents using `packages/contracts/events`).

`packages/web-kit`: `api = hc<AppType>('/')` helper + tiny fetch error handling, a few unstyled
UI primitives. No CSS framework in v1.

## 5. Infrastructure

### 5.1 State
S3 bucket `dr4w-tfstate-<account_id>`, `use_lockfile = true` (OpenTofu native S3 locking; no
DynamoDB lock table). Keys: `bootstrap/…`, `platform/terraform.tfstate`,
`projects/<p>/prod/terraform.tfstate`, later `projects/<p>/pr-<n>/…`.

### 5.2 Naming, tags, outputs (every module)
- Names: `dr4w-<project>-<env>-<thing>` (deploy role policies are scoped to `dr4w-*`).
- Tags via provider `default_tags`: `project`, `env`, `managed-by=opentofu`.
- Each module writes useful outputs to SSM `/dr4w/<project>/<env>/<key>` (String, or
  SecureString for secrets) and returns an `iam_statements` list the project stack merges
  into the Lambda role policy → least privilege, no wildcard actions.

### 5.3 Modules

| Module | Creates | Notes |
|---|---|---|
| `project-api` | Lambda (arm64, zip from `archive_file` over esbuild `dist/`), role w/ `dr4w-boundary`, HTTP API + `$default` stage throttling, log group 14d, alarms (Errors, 5xx) → `dr4w-alerts`, origin secret | `reserved_concurrency` var, default `null` (see D7) |
| `dynamo-table` | PAY_PER_REQUEST table from `tables.json` entry, PITR off, TTL optional | |
| `queue` | SQS + DLQ (maxReceive 5) + event source mapping to a consumer Lambda | |
| `cron` | EventBridge Scheduler schedule → Lambda | Scheduler role w/ boundary |
| `bucket` | private S3, SSE-S3, BPA on, TLS-only, optional lifecycle expiry | |
| `event-subscription` | rule on `dr4w-bus` (`source`, `detail-type`) → Lambda or queue | precondition: provider `exposes[consumer]` contains `events` |
| `project-ref` | reads provider SSM outputs + provider `project.json` | emits `iam_statements` only for granted capabilities; precondition fails plan otherwise |
| `pg-database` | DB + role in shared cluster via Data API (`aws rds-data` in `terraform_data` local-exec), per-project Secrets Manager secret | Only when platform PG enabled. Each secret ≈ $0.40/mo (D9) |

### 5.4 Bootstrap (`infra/bootstrap`, run once locally)
State bucket · GitHub OIDC provider · `dr4w-boundary` managed policy ·
`dr4w-ci-plan` (trust: `repo:Dr4wOne/dr4w:*`; ReadOnlyAccess + state R/W on lock files only) ·
`dr4w-ci-deploy` (trust: `repo:Dr4wOne/dr4w:environment:production` only — see D1; scoped policy;
`iam:CreateRole`/`PutRolePermissionsBoundary` conditioned on `iam:PermissionsBoundary = dr4w-boundary`;
denies changing/deleting the boundary and the CI roles themselves). After first apply, state is
migrated into the bucket (`tofu init -migrate-state`).

### 5.5 Platform (`infra/platform`)
`dr4w-bus` + 7-day archive · SNS `dr4w-alerts` → `dr4wone@gmail.com` · Budget $10/mo
(50/80/100%) → same email · optional Aurora Serverless v2 PG (`enable_shared_postgres=false`):
min 0 / max 2 ACU, auto-pause 300 s, Data API, default VPC, deletion protection, 7-day backups,
`manage_master_user_password`. Outputs → `/dr4w/platform/*`.

## 6. Cross-project contract

- **Sync:** `module "hello" { source = "../../../infra/modules/project-ref" project = "hello" consumer = "echo" }`
  → `module.hello.outputs.api_url`, `.table_name`, `.iam_statements`.
- **Async (preferred):** `PutEvents` on `dr4w-bus`, `source = "dr4w.<project>"`,
  `detail-type = "<Entity>.<Event>.v1"`, `detail` validated by the zod schema in
  `packages/contracts/events/<project>.ts`. Breaking change ⇒ new `vN` type, publish both for a while.
- Locally, `publish()` with `BUS_NAME` unset logs the event and, if the consumer project is also
  running, POSTs it to the consumer's `/api/_events` local dev hook (dev-only route, not mounted
  in Lambda). Good enough to exercise M4 offline.

## 7. CI/CD

| Workflow | Trigger | Steps |
|---|---|---|
| `ci.yml` | PR | pnpm install (cached) → `turbo lint typecheck test build` → `tofu fmt -check -recursive` → `tofu validate` (all stacks/modules, `-backend=false`) → `changed-projects` → matrix: `tofu plan` with `dr4w-ci-plan` → sticky PR comment |
| `deploy.yml` | push `main` | `changed-projects` → matrix (`concurrency: deploy-<p>`, `max-parallel: 1`): build → `tofu apply` → outputs → `wrangler deploy --var API_ORIGIN:<api_url>` + origin secret → Playwright smoke vs `https://<sub>.dr4w.io` |
| `platform.yml` | `workflow_dispatch` (main) | plan → apply `infra/platform` |
| `preview.yml` | PR (M5, optional) | `pr-<n>` stack + Worker preview URL; destroy on close |

Changed projects = `apps/<p>/**` touched; **all** projects when `packages/**`, `infra/modules/**`,
root lockfile, or `pnpm-workspace.yaml` change. Actions pinned to SHAs;
Dependabot for npm, github-actions, terraform (`infra/**`).

## 8. Local development

`pnpm dev` (pick a project) / `pnpm --filter <p>... dev`:
1. `docker compose up -d dynamodb-local` (+ `--profile pg postgres` if `db: "pg"`).
2. `scripts/seed.ts` creates tables from `tables.json` (idempotent).
3. API: `tsx watch src/local.ts` on `ports.api`.
4. Web: Vite + `@cloudflare/vite-plugin` on `ports.web` — runs the **real** `worker.ts` in workerd
   with `API_ORIGIN=http://localhost:<ports.api>` and a dev `ORIGIN_SECRET` from `.dev.vars`,
   so the proxy path is exercised locally too.

`pnpm dev:cloud <p>`: same API process with `AWS_PROFILE=dr4w`, env read from SSM, no
`DYNAMO_ENDPOINT`. Linux/macOS; Windows via WSL2.

## 9. Tooling versions (checked 2026-10-14, pinned in lockfiles)

node 24 LTS (Lambda runtime `nodejs24.x`, verified; `nodejs26.x` is preview-only until ~Nov 2026) · pnpm 12 · turbo 2.11 ·
TypeScript 7.0 · Vite 8 · React 19.3 · `@cloudflare/vite-plugin` 1.64 · wrangler 4.151 ·
Hono 4.13 · `@hono/node-server` 2.1 · zod 4.6 · Vitest 5 · Playwright 1.64 · esbuild 0.28 ·
Biome 2.5 (lint + format) · AWS SDK v3 · OpenTofu 1.13 · hashicorp/aws ~> 6.69.

Notes from M1:
- pnpm 12 enforces a minimum release age (~1 day) and blocks install scripts; allowed builds
  (`esbuild`, `workerd`) are listed under `allowBuilds` in `pnpm-workspace.yaml`.
- Cloudflare's new `cf` CLI is in open beta (Sept 2026); we stay on `wrangler` until it is GA.
- dynamodb-local is published on host port **8100** (8000 is a common dev-server port).
- With `@cloudflare/vite-plugin`, `vite build` writes `dist/client` + a generated
  `dist/<worker>/wrangler.json`; `wrangler deploy` picks that up automatically.

## 10. Decision log

| # | Decision | Why |
|---|---|---|
| D1 | **Repo is public.** Deploy role trusts only `environment:production` (as SPEC); Cloudflare secrets are environment secrets; `production` has no required reviewers and deploys only from `main` (deployment branch rule). Branch protection on `main` requires CI. | `Dr4wOne` is on GitHub Free, where environments/branch protection exist only for public repos. Consequences: `ideas/` and code are public (no secrets ever committed — already a rule); fork PRs get no OIDC token or secrets, and the "require approval for fork PR workflows" setting must be on. |
| D2 | Biome instead of ESLint + Prettier | One dev dependency, one config, fast. |
| D3 | `@cloudflare/vite-plugin` for web dev/build | Runs `worker.ts` locally in workerd; build output is what `wrangler deploy` ships. |
| D4 | Explicit `.route()` mount per endpoint | Keeps Hono RPC end-to-end types. |
| D5 | Origin secret in SSM, read by Lambda at cold start | Not visible in Lambda config to read-only principals. |
| D6 | `exposes` grant vocabulary + `project-ref` preconditions | Cross-project access is opt-in by the provider and fails at `plan`, not at runtime. |
| D7 | `reserved_concurrency` default `null` | AWS rejects reservations that leave < 100 unreserved; new accounts may have a 10 limit. Set to 10 once quota ≥ 1000 (`docs/bootstrap.md` explains). API GW throttling is the always-on cap. |
| D8 | Root `dr4w.io` untouched | Owned by `dr4w-landpage`. A "live projects" page is a later idea. |
| D9 | `pg-database` uses Data API + per-project Secrets Manager secret | Data API requires a Secrets Manager secret (~$0.40/mo each). Only paid when PG is enabled. |
| D10 | CI still plans only changed projects | Public repo has unlimited standard-runner minutes, but fast CI is still nicer; turbo cache via `actions/cache`. |
