---
description: Add infra to a project — table | queue | bucket | cron | event — module block + wiring + local equivalent
argument-hint: <project> <table|queue|bucket|cron|event> [name/details]
---

Add a `$2` to project `$1` (arguments: $ARGUMENTS). Use only `infra/modules/*`
(catalog: `infra/modules/README.md`). Edit `apps/$1/infra/main.tf`; pass new `iam_statements`
into `module "api"` (concat with the existing list) and new resource names as env vars.

- **table**: add a key to `apps/$1/infra/tables.json` (hashKey/rangeKey/attributes/GSIs/ttl) — the
  existing `module "tables"` for_each picks it up. Env: `TABLE_<KEY>_NAME = module.tables["<key>"].name`
  and add it to `api/src/env.ts`. Locally `pnpm dev` seeds it automatically.
- **queue**: `module "<name>_queue" { source = "../../../infra/modules/queue" … consumer_function_name = module.api.function_name }`;
  env `QUEUE_URL`; consume in the Lambda (SQS events aren't dispatched yet — add an `isSqsEvent`
  branch in a project-local wrapper around `createLambdaHandler` and say so). Locally: call the
  handler directly in tests.
- **bucket**: `module "<name>_bucket" { source = "../../../infra/modules/bucket" … }`; env
  `BUCKET_NAME`; use `@aws-sdk/client-s3` (add to the api package via `catalog:`). Locally: tests mock S3.
- **cron**: `module "<name>_cron" { source = "../../../infra/modules/cron" … function_arn = module.api.function_arn }`;
  handle the `dr4w.cron` / `Cron.<name>.v1` envelope in `api/src/events.ts` (add a
  `defineEvent` for it in contracts). Locally: POST the envelope to `/api/_events`.
- **event**: consuming another project's event → follow `docs/guides/connect-projects.md`
  (exposes/uses, `onEvent`, `event-subscription`). Publishing → `defineEvent` + `publish()` +
  `publishes_events = true`.

Then `pnpm infra:check`, `pnpm --filter $1-api typecheck test`, and — if I've said so — a
read-only `tofu plan` with `AWS_PROFILE=dr4w` (use `rtk proxy tofu plan`). Never apply.
