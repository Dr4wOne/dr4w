# dr4w — Tasks

Each task is small, ends in a verifiable check, and is ticked when done.
⏸ = stop for approval. Commands assume repo root `~/dr4w`.

## M1 — Skeleton & local dev (offline, no cloud)

**1.0 Repo & tooling**
- [x] 1.0 Save the SDD prompt as `docs/SPEC.md` (with amendments per decisions D1/D7).
- [x] 1.1 Verify current docs: Lambda Node runtime id (expect `nodejs24.x`), Workers Static Assets config, `@cloudflare/vite-plugin`, Hono aws-lambda adapter, OpenTofu S3 `use_lockfile`. Record findings in `architecture.md §9`.
- [x] 1.2 Root: `package.json` (pnpm 12, `packageManager`, engines node 24), `pnpm-workspace.yaml`, `turbo.json` (build/lint/typecheck/test/dev), `tsconfig.base.json`, `biome.json`, `.gitignore`, `.editorconfig`, `.nvmrc`. ✓ `pnpm install && pnpm turbo lint typecheck` on empty workspace.
- [x] 1.3 `docker-compose.yml`: `dynamodb-local` (port 8000), `postgres` under profile `pg`. ✓ `docker compose up -d dynamodb-local` + `aws dynamodb list-tables --endpoint-url http://localhost:8000`.

**1.1 Packages**
- [x] 1.4 `packages/contracts`: zod `Note`, `CreateNote`; `events/hello.ts` with `NoteCreatedV1` + `EventEnvelope` helper. ✓ unit test parses valid/invalid.
- [x] 1.5 `packages/api-kit`: `originSecret()` (timing-safe, health exempt), `errorHandler`, `requestLogger`, `validate`, `ddb()`, `publish()` (local + bus modes), `loadSecret()` (SSM, cached). ✓ tests for each middleware via `app.request`.
- [x] 1.6 `packages/web-kit`: `createApi<AppType>()` wrapper over `hc`, `ApiError`. ✓ typecheck + one test with mocked fetch.

**1.2 Template & `hello`**
- [x] 1.7 `templates/project/` with `{{name}}`/`{{subdomain}}` tokens: `project.json`, `README.md`, `api/` (app, health route, lambda, local, env, test), `web/` (Vite React, `worker.ts`, `wrangler.jsonc`, `.dev.vars.example`), `infra/` (stub `main.tf`, `backend.tf`, `tables.json`), `.env.example`.
- [x] 1.8 `scripts/new-project.ts` (`pnpm new <name>`): validate name, copy template, replace tokens, assign next free `ports`, create `.env.local` + `.dev.vars` from examples. ✓ `pnpm new tmp && pnpm --filter tmp... test && rm -rf apps/tmp`.
- [x] 1.9 `pnpm new hello`; add `routes/notes.ts` (list, get, create, update, delete) on DynamoDB, `NoteCreatedV1` publish on create. ✓ route tests against dynamodb-local.
- [x] 1.10 `hello` web: list + create + delete notes via typed client. ✓ component test (Vitest + Testing Library, jsdom).
- [x] 1.11 `worker.ts`: `/api/*` → proxy with secret header (strip client copy), else assets with SPA fallback. ✓ unit test with mocked `fetch`/`ASSETS`.
- [x] 1.12 `scripts/seed.ts` (tables from `tables.json`, idempotent) and `scripts/dev.ts` (`pnpm dev` picker → compose up, seed, run api + web in parallel). ✓ manual: `pnpm dev`, pick hello, create a note in the browser with network offline.
- [x] 1.13 `scripts/changed-projects.ts` (+ tests for the "all projects" rules). Used by CI later.
- [x] 1.14 Minimal root `README.md` + `CLAUDE.md` (conventions, where things live).
- [x] 1.15 Full check: `pnpm turbo lint typecheck test build`. ⏸ **M1 review**

## M2 — Bootstrap & platform

- [x] 2.1 Install OpenTofu 1.13.x (official installer, documented in `bootstrap.md`); pin via `.opentofu-version`. ✓ `tofu version`.
- [x] 2.2 `infra/bootstrap`: providers (aws ~> 6.69), local backend, state bucket (versioning, SSE, BPA, TLS-only, lifecycle for old versions 90d), OIDC provider, `dr4w-boundary`, `dr4w-ci-plan`, `dr4w-ci-deploy` (D1). ✓ `tofu fmt -check && tofu validate`.
- [x] 2.3 `infra/platform`: bus + archive, SNS + email sub, budget, optional Aurora block, SSM outputs, `backend.tf`. ✓ `tofu validate`; `enable_shared_postgres=true` also validates.
- [x] 2.4 `docs/bootstrap.md`: exact steps for SPEC §11 (aws-cli ≥ 2.9 upgrade, Identity Center + `aws configure sso --profile dr4w`, root MFA, Cloudflare token scopes, GitHub repo `Dr4wOne/dr4w` + repo secrets, Lambda concurrency quota check/increase, bootstrap apply + state migration, confirm SNS).
- [x] 2.5a Bootstrap applied 2026-10-14 (16 resources), state migrated to S3. Lambda quota 10 → increase to 1000 requested.
- [x] 2.5 Platform applied 2026-10-14 (8 resources: dr4w-bus + archive, dr4w-alerts, dr4w-monthly budget, 3 SSM params).
- [x] 2.6 SNS subscription confirmed. Lambda quota increase to 1000 still pending (case opened).

## M3 — First deploy (`hello`)

- [x] 3.1 `infra/modules/project-api` (Lambda, role+boundary, HTTP API + throttling, log group 14d, alarms, origin secret, SSM outputs, `iam_statements` merge). ✓ validate.
- [x] 3.2 `infra/modules/dynamo-table` reading one `tables.json` entry. ✓ validate.
- [x] 3.3 `apps/hello/infra/main.tf` wiring; `api` build script (esbuild → `dist/lambda.mjs`). ✓ `tofu plan` locally (SSO) shows expected resources only.
- [x] 3.4 `.github/workflows/ci.yml` (SHA-pinned actions, plan comment). ✓ opens on a test PR.
- [x] 3.5 `.github/workflows/deploy.yml` + `platform.yml` + `.github/dependabot.yml`.
- [x] 3.6 Playwright smoke (`/api/health` 200, home page renders, create+list note). Lives in `apps/<p>/web/e2e`, run against `BASE_URL`.
- [x] 3.7 ⏸ On your **"go"**: merge to `main` → deploy. ✓ `https://hello.dr4w.io` live, smoke green, `curl <execute-api>/api/notes` → 403, `/api/health` → 200.

## M4 — Second project + connection (`echo`)

- [ ] 4.1 Modules: `event-subscription`, `project-ref`, `queue`, `cron`, `bucket`, `pg-database` (validated; pg not applied).
- [ ] 4.2 `exposes` zod schema + check in `scripts/` (CI fails on unknown grants or `uses` without matching `exposes`).
- [ ] 4.3 `pnpm new echo`; `hello/project.json` exposes `{ "echo": ["events"] }`; `echo` `uses: ["hello"]`.
- [ ] 4.4 `echo`: event handler (`lambda-events.ts` entry) validates `NoteCreatedV1`, increments counter in its table; `GET /api/count`. ✓ unit test with a sample event.
- [ ] 4.5 Local path: `publish()` dev hook → `echo` `/api/_events` (dev only). ✓ both running, create note in hello → count increments.
- [ ] 4.6 `docs/connecting-projects.md` using hello→echo as the worked example.
- [ ] 4.7 ⏸ On your **"go"**: merge → both deploy. ✓ create note on hello.dr4w.io → echo.dr4w.io count increments.

## M5 — Idea pipeline & polish

- [ ] 5.1 `.claude/commands/`: `idea`, `refine`, `spec`, `plan`, `poc`, `launch`, `endpoint`, `resource` (each short; frontmatter `status` updates; `/spec` only allows catalog modules).
- [ ] 5.2 `ideas/_template/` + `scripts/ideas-status.ts` (`pnpm ideas` table).
- [ ] 5.3 `pnpm dev:cloud <p>`.
- [ ] 5.4 `docs/runbook.md`: rollback (re-run deploy on previous SHA / `wrangler rollback`), destroy a project (tofu destroy + `wrangler delete` + remove folder), rotate origin secret, rotate Cloudflare token, budget alert response.
- [ ] 5.5 Final `README.md` (5-minute tour) and `CLAUDE.md` pass.
- [ ] 5.6 Dry run of the DoD: `/idea` → `/launch` on a throwaway idea, timed (< 15 min); `/endpoint` timed (< 5 min).
- [ ] 5.7 (Optional) `preview.yml`: `pr-<n>` stacks, Worker preview URLs, destroy on close.
- [ ] 5.8 ⏸ **M5 review**. One week later: check Cost Explorer (target $0–2/mo idle).
