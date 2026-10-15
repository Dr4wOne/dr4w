# Conventions

## Names
| Thing | Pattern | Example |
|---|---|---|
| Project | lowercase, `^[a-z][a-z0-9-]{1,19}$` | `hello` |
| AWS resource | `dr4w-<project>-<env>-<thing>` | `dr4w-hello-prod-api`, `dr4w-echo-prod-main` |
| Buckets (need global uniqueness) | `dr4w-<project>-<env>-<thing>-<account>` | `dr4w-hello-prod-artifacts-809411919562` |
| SSM parameter | `/dr4w/<project>/<env>/<key>` (platform: `/dr4w/platform/<key>`) | `/dr4w/hello/prod/api_url` |
| Worker | `dr4w-<project>` on `<subdomain>.dr4w.io` | `dr4w-echo` |
| Event | `source = dr4w.<project>`, `detail-type = <Entity>.<Event>.v<N>` | `Note.Created.v1` |
| Cron envelope | `source = dr4w.cron`, `detail-type = Cron.<name>.v1` | — |
| Tags (every AWS resource) | `project`, `env`, `managed-by=opentofu` | via provider `default_tags` |
| State key | `projects/<project>/<env>/terraform.tfstate` | — |

## Git
- Never push to `main` (protected: `check` + `plan` must pass). Branch `feat/…`, `fix/…`,
  `docs/…`, `launch/<slug>`, `cleanup/…`; squash-merge PRs.
- Commit subject: imperative, ≤ 72 chars, optional scope (`project-api: ship Lambda code via S3`);
  body explains *why*. Claude-made commits end with the `Co-Authored-By` line.
- Push (no credential helper on the laptop): `git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push -u origin <branch>`.

## Project layout (`apps/<p>/`)
`project.json` (manifest) · `README.md` · `CLAUDE.md` · `api/src/{app,lambda,local,env,events}.ts`
· `api/src/routes/<resource>.ts` (+ `.test.ts`) · `api/src/data/<resource>.ts` · `api/test/` ·
`web/src/` (React) · `web/worker/index.ts` (proxy) · `web/e2e/smoke.spec.ts` · `web/wrangler.jsonc`
· `infra/{main,variables,versions,outputs}.tf` · `infra/tables.json`.

## Code
- TypeScript ESM, `.ts` extensions in imports, internal packages export source. Biome: single
  quotes, no semicolons, 100 columns (`pnpm format`).
- Env vars only through `api/src/env.ts` (`parseEnv` + zod).
- Versions only in the `catalog:` of `pnpm-workspace.yaml`.

## API errors (`packages/api-kit/src/errors.ts`)
| Case | Status | Body |
|---|---|---|
| Invalid input (zod) | 400 | from `@hono/zod-validator` (`{ success: false, error }`) or `{ error: "validation", issues }` |
| Missing/wrong origin secret | 403 | `{ "error": "forbidden" }` |
| Not found | 404 | `{ "error": "not_found" }` |
| Unexpected | 500 | `{ "error": "internal" }` — details only in logs |

## Logs (`packages/api-kit/src/log.ts`)
One JSON object per line: `{"level","msg",…}`. Requests: `requestId`, `method`, `path`, `status`, `ms`.
`LOG_LEVEL` (default `info`) filters; tests use `warn`.

## Tests
- Every route with logic: a Vitest test via `call()` (`api/test/helpers.ts`), including the 403 case.
- API tests run against dynamodb-local tables `dr4w-<p>-test-*` (recreated per run).
- Components: `// @vitest-environment jsdom`; Worker: plain Node tests.
- Every project: a Playwright smoke test that the deploy runs against the live URL.

## Docs
- **Direct.** Lead with the command or the answer; no intros.
- **Short.** `README.md` ≤ 150 lines, `CLAUDE.md` ≤ 80, `apps/<p>/CLAUDE.md` ≤ 30, any other doc ≤ 200 (split if bigger).
- **One home per fact.** Link to it instead of copying it. Index: `docs/README.md`.
- **Real examples only**, with the file path; every command must work when pasted at the repo root.
- **Dated where it rots:** versions, costs and status carry a "last checked" date.
- Plain, complete English — also when chat replies are terse.
- A user-visible change updates its doc and `docs/STATUS.md` in the same PR (`/doc-check`).
