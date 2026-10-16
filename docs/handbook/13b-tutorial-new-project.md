# 13b · Tutorial B: launch a project that runs on a schedule and consumes events

> **In one sentence:** build a new project `digest` that counts `hello`'s new notes per day and saves a nightly summary — using an event subscription and a cron schedule.
> **Reading time:** ~30 min · **Level:** 🟢 beginner-friendly · Do [tutorial A](13-tutorials.md) first

Steps marked ☁️ change production. Everything else runs only on your laptop.

> The `cron` module is validated but has never been deployed (`docs/STATUS.md` → Known issues).
> The local part is safe; treat the ☁️ part as its first real test.

**Goal:** `GET /api/digests` returns one line per day, e.g. `{"date":"2026-10-15","notes":3}`.

**1. Scaffold and link:** `git checkout main && git pull && git checkout -b launch/digest && pnpm new digest`.
In `apps/hello/project.json` set `"exposes": { "echo": ["events"], "digest": ["events"] }`, and in
`apps/digest/project.json` set `"uses": ["hello"]`. Check: `pnpm check:projects`.
In `apps/digest/infra/tables.json` add `"ttlAttribute": "expiresAt"` to `main` (as in `apps/echo/infra/tables.json`),
and add `"@aws-sdk/lib-dynamodb": "catalog:"` to `dependencies` in `apps/digest/api/package.json`, then `pnpm install`.

**2. The schedule's event** — create a new file `cron.ts` in `packages/contracts/src/events/` and add
`export * from './cron.ts'` to `packages/contracts/src/events/index.ts`:
```ts
import { z } from 'zod'
import { defineEvent } from './envelope.ts'

// What the cron module sends every night (source dr4w.cron, chapter 8's envelope shape).
export const DailyDigestCronV1 = defineEvent({
  source: 'dr4w.cron',
  detailType: 'Cron.daily-digest.v1',
  detail: z.object({}),
})
```

**3. Data** — create a new file `days.ts` in `apps/digest/api/src/data/`:
```ts
import { ddb } from '@dr4w/api-kit'
import { GetCommand, PutCommand, QueryCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb'
import { env } from '../env.ts'

/** Count one Note.Created event once (idempotent: a redelivery changes nothing). */
export async function countNote(eventId: string, createdAt: string) {
  try {
    await ddb().send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: env.TABLE_NAME,
              Item: { pk: `EVENT#${eventId}`, sk: 'seen', expiresAt: Math.floor(Date.now() / 1000) + 7 * 86400 },
              ConditionExpression: 'attribute_not_exists(pk)',
            },
          },
          {
            Update: {
              TableName: env.TABLE_NAME,
              Key: { pk: 'DAY', sk: createdAt.slice(0, 10) },
              UpdateExpression: 'ADD notes :one',
              ExpressionAttributeValues: { ':one': 1 },
            },
          },
        ],
      }),
    )
  } catch (err) {
    // Only "the event id already exists" means duplicate; anything else must fail so it's retried.
    const reasons = (err as { CancellationReasons?: { Code?: string }[] }).CancellationReasons
    if (reasons?.[0]?.Code === 'ConditionalCheckFailed') return
    throw err
  }
}

export async function writeDigest(date: string) {
  const day = await ddb().send(new GetCommand({ TableName: env.TABLE_NAME, Key: { pk: 'DAY', sk: date } }))
  const notes = Number(day.Item?.notes ?? 0)
  await ddb().send(new PutCommand({ TableName: env.TABLE_NAME, Item: { pk: 'DIGEST', sk: date, notes } }))
}

export async function listDigests() {
  const res = await ddb().send(
    new QueryCommand({
      TableName: env.TABLE_NAME,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: { ':pk': 'DIGEST' },
      ScanIndexForward: false,
    }),
  )
  return (res.Items ?? []).map((i) => ({ date: String(i.sk), notes: Number(i.notes) }))
}
```

**4. Handlers and route** — replace the `events` list in `apps/digest/api/src/events.ts`:
```ts
import { type EventRoute, onEvent } from '@dr4w/api-kit'
import { DailyDigestCronV1, NoteCreatedV1 } from '@dr4w/contracts/events'
import { countNote, writeDigest } from './data/days.ts'

export const events: EventRoute[] = [
  onEvent(NoteCreatedV1, (note, meta) => countNote(meta.id, note.createdAt)),
  onEvent(DailyDigestCronV1, (_detail, meta) => writeDigest(meta.time.slice(0, 10))),
]
```
Create `digests.ts` in `apps/digest/api/src/routes/` and mount it with `.route('/digests', digests)` in `apps/digest/api/src/app.ts`:
```ts
import { Hono } from 'hono'
import { listDigests } from '../data/days.ts'

export const digests = new Hono().get('/', async (c) => c.json({ items: await listDigests() }, 200))
```
Test it like `apps/echo/api/src/events.test.ts`: call `handler(envelope, {})` (exported by the project's `src/lambda.ts`) with a
`Note.Created.v1` envelope (twice — it must count once), then a `Cron.daily-digest.v1` one, then
`call('/api/digests')`. Run `pnpm --filter digest-api test`.

**5. Infra** — add to `apps/digest/infra/main.tf` (`cron` uses EventBridge Scheduler, AWS's timer service):
```hcl
module "from_hello" {
  source           = "../../../infra/modules/event-subscription"
  project          = local.project.name
  env              = var.env
  provider_project = "hello"
  detail_types     = ["Note.Created.v1"]
  function_arn     = module.api.function_arn
  function_name    = module.api.function_name
}

module "nightly" {
  source       = "../../../infra/modules/cron"
  project      = local.project.name
  env          = var.env
  name         = "daily-digest"
  schedule     = "cron(55 23 * * ? *)"
  function_arn = module.api.function_arn
}
```
Check: `pnpm infra:check`.

**6. Run it locally** (`pnpm new` gave `digest` the next free ports — web 5175, API 8789; see `apps/digest/project.json`):
```bash
pnpm dev hello digest
curl -s -X POST localhost:5173/api/notes -H 'content-type: application/json' -d '{"title":"for the digest"}'
curl -s -X POST localhost:8789/api/_events -H 'content-type: application/json' \
  -d "{\"id\":\"local-1\",\"source\":\"dr4w.cron\",\"detail-type\":\"Cron.daily-digest.v1\",\"time\":\"$(date -u +%FT%TZ)\",\"detail\":{}}"
curl -s localhost:5175/api/digests
```
The second command plays the scheduler's part: `/api/_events` exists only locally and has no secret
check (chapter 8). Expected: `{"items":[{"date":"<today>","notes":1}]}` (or more).

**7. ☁️ Launch** — `/launch digest`, or by hand: `pnpm format && pnpm check`, push, open the PR, read
the plan (creates for `digest`; because `packages/contracts` changed, `hello` and `echo` also get a
code-only update), merge, then `curl -s https://digest.dr4w.io/api/health`. The first nightly run is
at 23:55 UTC; until then `GET /api/digests` is empty.

**8. ☁️ Clean up (optional)** — remove `digest` from `hello`'s `exposes`, merge, then follow `docs/guides/destroy-project.md`.

## Common mistakes
- Forgetting the `exposes` grant — the plan fails with a precondition error (chapter 8).
- Swallowing every error in an event handler: only a duplicate may be ignored (step 3).

## Check yourself
1. What triggers the nightly summary, and how does it reach your code?
2. Why does `countNote` write an `EVENT#<id>` item?

<details><summary>Answers</summary>

1. EventBridge Scheduler (the `cron` module) invokes the Lambda with a `dr4w.cron` / `Cron.daily-digest.v1` envelope; `createLambdaHandler` routes it to the `onEvent(DailyDigestCronV1, …)` handler.
2. So a redelivered event is recognized and not counted twice (idempotency).
</details>

## Learn more
`docs/guides/new-resource.md` · `docs/guides/connect-projects.md` · EventBridge Scheduler expressions:
https://docs.aws.amazon.com/scheduler/latest/UserGuide/schedule-types.html · next: [14 · Why this stack](14-why-this-stack.md)
