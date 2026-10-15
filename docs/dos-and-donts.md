# Do's and don'ts

## API

### Add endpoints as route files, not new Lambdas
✅ Do — `apps/hello/api/src/routes/notes.ts`
```ts
export const notes = new Hono()
  .get('/', async (c) => c.json({ items: await listNotes() }, 200))
  .post('/', validate('json', CreateNote), async (c) => { /* … */ })
```
❌ Don't — a new `aws_lambda_function` per endpoint.
Why: one Lambda per project keeps infra fixed; new Lambdas need new IAM, logs and alarms.

### Validate input with shared zod schemas
✅ Do — `validate('json', CreateNote)` with `CreateNote` from `packages/contracts/src/hello.ts`.
❌ Don't — `const body = await c.req.json(); if (!body.title) …`
Why: one schema serves the API, the typed web client and tests.

## Frontend

### Call the API only through `/api/*` on the same origin
✅ Do — `apps/hello/web/src/api.ts`: `export const api = createApi<AppType>().api`
❌ Don't — `fetch('https://abc123.execute-api.us-east-1.amazonaws.com/api/notes')`
Why: the browser can't send the origin secret, so direct calls get 403 — and no CORS is needed.

## Infra

### New infra only through `infra/modules/*`
✅ Do — `apps/echo/infra/main.tf`
```hcl
module "from_hello" {
  source           = "../../../infra/modules/event-subscription"
  provider_project = "hello"
  detail_types     = ["Note.Created.v1"]
  # …
}
```
❌ Don't — `resource "aws_cloudwatch_event_rule" "x" { … }` in a project stack.
Why: modules carry naming, tags, least-privilege IAM and SSM outputs; raw resources skip all of it.

### Never wildcard IAM actions
✅ Do — explicit lists, like `iam_statements` in `infra/modules/dynamo-table/outputs.tf`
(`dynamodb:GetItem`, `dynamodb:PutItem`, …).
❌ Don't — `actions = ["dynamodb:*"]` in a workload role.
Why: the Lambda gets only what it uses; `dr4w-boundary` is a backstop, not the plan.

### Keep the cost guardrails
❌ Don't — NAT gateways, load balancers, VPC Lambdas, provisioned capacity, CloudWatch dashboards.
Why: each one has a monthly floor; dr4w's goal is ≈ $0 idle (`docs/costs.md`).

## Data

### Table key schema only in `tables.json`
✅ Do — `apps/echo/infra/tables.json` (read by `scripts/seed.ts` and by OpenTofu via `jsondecode`).
❌ Don't — `hash_key = "pk"` typed again in `main.tf`, or a `CreateTable` call in code.
Why: one definition → local and cloud can't drift.

### Make event handlers idempotent
✅ Do — `apps/echo/api/src/data/counter.ts`: record the event id and update the counter in one transaction.
❌ Don't — `ADD count :one` on every delivery.
Why: EventBridge delivers at least once; retries would double-count.

## Cross-project

### Use `project-ref` or events, never hardcoded names
✅ Do — `module "hello" { source = "../../../infra/modules/project-ref" … }` and `module.hello.outputs["api_url"]`.
❌ Don't — `TABLE = "dr4w-hello-prod-main"` in another project.
Why: grants come from the provider's `exposes`; plans fail if the link isn't declared.

## Secrets

### Secrets in SSM or Worker secrets only
✅ Do — `originSecretFromEnv()` in `packages/api-kit/src/origin-secret.ts` reads SSM by parameter name.
❌ Don't — `"vars": { "ORIGIN_SECRET": "…" }` in `wrangler.jsonc`, or a committed `.env`.
Why: the repo is public; vars are visible in the Cloudflare dashboard. More: `docs/security.md`.

## CI/CD

### Change `main` only through PRs
✅ Do — branch → PR → green `check` + `plan` → squash-merge (`docs/guides/deploy.md`).
❌ Don't — push to `main`, or apply project stacks from the laptop.
Why: the PR plan is the review of what will change in production.

## Testing

### Every route with logic has a test using `app.request`
✅ Do — `apps/hello/api/src/routes/notes.test.ts` with `call()` from `apps/hello/api/test/helpers.ts`.
❌ Don't — test only by clicking through `pnpm dev`.
Why: route tests run in CI in seconds against dynamodb-local.

## Docs

### Every user-visible change updates its doc and `docs/STATUS.md`
✅ Do — run `/doc-check` before merging and `/handoff` at the end of a session.
❌ Don't — leave the explanation only in the chat or a PR comment.
Why: the repo is the memory; the next session starts from `CLAUDE.md` and `docs/STATUS.md`.
