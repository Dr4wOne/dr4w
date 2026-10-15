# Add infrastructure to a project

**Goal:** a table, queue, bucket, cron schedule or event subscription, using only the module
catalog (`infra/modules/README.md`). With Claude: `/resource <project> <kind>`
(`.claude/commands/resource.md`, which has the exact block for each kind).

## Steps
1. Add the module block to `apps/<project>/infra/main.tf` (tables: just add a key to
   `apps/<project>/infra/tables.json` — the existing `module "tables"` picks it up).
2. Pass its `iam_statements` into `module "api"` and its resource name as an env var.
3. Read the env var in `apps/<project>/api/src/env.ts`.
4. Check: `pnpm infra:check`, then a read-only plan:
   ```bash
   cd apps/<project>/infra && AWS_PROFILE=dr4w tofu init -backend-config=../../../infra/backend.hcl && AWS_PROFILE=dr4w tofu plan
   ```

## Real example
`apps/echo/infra/main.tf` — `module "tables"` (from `tables.json`, with a TTL attribute),
`module "from_hello"` (event subscription) and `module "hello"` (project-ref).

## Verify
The PR's plan comment shows only the resources you expect.

## Common mistakes
- Raw `resource "aws_…"` blocks in a project stack — always go through a module.
- Queues: SQS messages are not routed by `createLambdaHandler` yet (`docs/STATUS.md` → Known issues).
