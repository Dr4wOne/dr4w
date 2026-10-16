# 13 · Tutorials

> **In one sentence:** two hands-on walkthroughs — A adds a feature to `hello` end to end, B launches a new project that runs on a schedule and reacts to `hello`'s events.
> **Reading time:** ~30 min each · **Level:** 🟢 beginner-friendly

Steps marked ☁️ change production. Everything else runs only on your laptop. Do the ☁️ steps
only if you mean to ship; otherwise stop after the local part.

## A · Ship your first feature on `hello`
**Goal:** add an endpoint `GET /api/notes/count`, and show the note count in the page title.
Verified 2026-10-15: steps 2–5 pass `typecheck` and `test` for both packages.

**1. Branch:** `git checkout main && git pull && git checkout -b feat/notes-count`

**2. Data function** — add to `apps/hello/api/src/data/notes.ts` (`ddb`, `QueryCommand`, `env` and `PK` are already imported or defined there):
```ts
export async function countNotes(): Promise<number> {
  let total = 0
  let ExclusiveStartKey: Record<string, unknown> | undefined
  do {
    const res = await ddb().send(
      new QueryCommand({
        TableName: env.TABLE_NAME,
        KeyConditionExpression: 'pk = :pk',
        ExpressionAttributeValues: { ':pk': PK },
        Select: 'COUNT',
        ExclusiveStartKey,
      }),
    )
    total += res.Count ?? 0
    ExclusiveStartKey = res.LastEvaluatedKey
  } while (ExclusiveStartKey)
  return total
}
```

**3. Route** — in `apps/hello/api/src/routes/notes.ts`, add it to the chain **before** `.get('/:id', …)`
(Hono matches in order; otherwise `count` would be read as an `:id`, fail the uuid check in
`byId`, and be rejected with `400`), and add `countNotes` to the import from `../data/notes.ts`:
```ts
  .get('/count', async (c) => c.json({ count: await countNotes() }, 200))
```
No `app.ts` change is needed: `notes` is already mounted.

**4. Test** — add to `apps/hello/api/src/routes/notes.test.ts`:
```ts
  it('counts notes', async () => {
    const before = ((await (await call('/api/notes/count')).json()) as { count: number }).count
    await create('counted')
    const after = ((await (await call('/api/notes/count')).json()) as { count: number }).count
    expect(after).toBeGreaterThanOrEqual(before + 1)
  })
```
```bash
pnpm --filter hello-api test
```
Expected: all tests pass (≥ is used because other tests insert notes in parallel).

**5. UI** — in `apps/hello/web/src/App.tsx`, change the heading to use the list you already have:
```tsx
      <h1>Notes ({notes.length})</h1>
```
(The page already has the list, so it counts that; the endpoint is for other clients, or for when the list gets paginated.) `pnpm --filter hello-web test` still passes.

**6. Run it**
```bash
pnpm dev hello
curl -s localhost:5173/api/notes/count
```
Expected: `{"count":N}`; the page title shows the same number. Stop with Ctrl-C.

**7. Check everything, then open a PR**
```bash
pnpm format          # wraps the longer import line in notes.ts
pnpm check
git add -A && git commit -m "hello: note count endpoint and title"
git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push -u origin feat/notes-count
gh pr create --fill
gh pr checks --watch
```
The push command uses GitHub's CLI (`gh`, `docs/setup-new-machine.md`) to log git in for this one push.
Expected: `check` and `plan` pass; the plan comment shows `hello` — `1 to add, 1 to change, 1 to destroy`:
a new code zip in S3 is added, the old one destroyed, and the Lambda changed to use it.

**8. ☁️ Merge and verify**
```bash
gh pr merge --squash --delete-branch
gh run watch "$(gh run list --workflow deploy.yml --limit 1 --json databaseId -q '.[0].databaseId')"
curl -s https://hello.dr4w.io/api/notes/count
```
Expected: a green deploy run (smoke test included); the live endpoint returns `{"count":…}`.

**9. ☁️ Roll back (practice)** — revert the merge commit in a new PR (`docs/guides/rollback.md`):
```bash
git checkout main && git pull && git checkout -b revert/notes-count
git revert --no-edit HEAD
git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push -u origin revert/notes-count
gh pr create --fill
```
Merging it puts the previous version back.

## B · Launch a project that runs on a schedule and consumes events
**Goal:** a new project `digest` that counts `hello`'s new notes per day and, every night, saves a
one-line summary that `GET /api/digests` returns. It uses two catalog modules for the first time
together: `event-subscription` and `cron`.

> The `cron` module is validated but has never been deployed (`docs/STATUS.md` → Known issues).
> The local part is safe; treat the ☁️ part as its first real test.

**1. Scaffold and link:** `git checkout main && git pull && git checkout -b launch/digest && pnpm new digest`.
In `apps/hello/project.json` set `"exposes": { "echo": ["events"], "digest": ["events"] }`, and in
`apps/digest/project.json` set `"uses": ["hello"]`. Check: `pnpm check:projects`.

**2. Contracts** — create a new file `cron.ts` in `packages/contracts/src/events/` and export it from
`packages/contracts/src/events/index.ts`:
```ts
import { z } from 'zod'
import { defineEvent } from './envelope.ts'

export const DailyDigestCronV1 = defineEvent({
  source: 'dr4w.cron',
  detailType: 'Cron.daily-digest.v1',
  detail: z.object({}),
})
```

**3. Handlers** — in `apps/digest/api/src/events.ts`, register one handler per event:
`onEvent(NoteCreatedV1, …)` (an event handler, chapter 8; the event arrives in the standard envelope) adds 1 to an item `pk = "DAY", sk = <yyyy-mm-dd>` (idempotent, like
`apps/echo/api/src/data/counter.ts`), and `onEvent(DailyDigestCronV1, …)` reads today's counter and
writes `pk = "DIGEST", sk = <yyyy-mm-dd>` with `{ notes: n }`. Add a route `GET /api/digests` that
queries `pk = "DIGEST"` (see `docs/guides/new-endpoint.md`), with tests via `call()` and by calling
`handler(envelope, {})` from `src/lambda.ts`, as `apps/echo/api/src/events.test.ts` does.

**4. Infra** — add to `apps/digest/infra/main.tf` (`cron` uses EventBridge Scheduler, AWS's timer service):
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

**5. Run it locally**
```bash
pnpm dev hello digest
curl -s -X POST localhost:5173/api/notes -H 'content-type: application/json' -d '{"title":"for the digest"}'
curl -s -X POST localhost:8789/api/_events -H 'content-type: application/json' \
  -d '{"id":"local-1","source":"dr4w.cron","detail-type":"Cron.daily-digest.v1","time":"2026-10-15T23:55:00Z","detail":{}}'
curl -s localhost:5175/api/digests
```
(`pnpm new` gave `digest` the next free ports — web 5175, API 8789 — check `apps/digest/project.json`.) Expected: the digest
list contains today's date with `notes: 1` or more.

**6. ☁️ Launch** — `/launch digest`, or by hand: `pnpm check`, push, open the PR, read the plan
(creates for `digest`; because `packages/contracts` changed, `hello` and `echo` also get a
code-only update), merge, then verify
`curl -s https://digest.dr4w.io/api/health`. The first nightly run happens at 23:55 UTC; until
then, `GET /api/digests` is empty.

**7. ☁️ Clean up (optional)** — remove the `digest` entries from `hello`'s `exposes`, merge, then
`docs/guides/destroy-project.md`.

## Common mistakes
- Declaring `/:id` before a fixed path like `/count` (tutorial A, step 3).
- Forgetting the `exposes` grant — the plan fails with a precondition error (chapter 8).
- Non-idempotent event handlers (`docs/dos-and-donts.md` → Data).

## Check yourself
1. Why must `.get('/count')` come before `.get('/:id')`?
2. In tutorial B, what triggers the nightly summary, and how does it reach your code?
3. Which steps of tutorial A change production?

<details><summary>Answers</summary>

1. Hono matches routes in order; `/:id` would match `count` first and reject it as an invalid uuid.
2. EventBridge Scheduler (the `cron` module) invokes the Lambda with a `dr4w.cron` / `Cron.daily-digest.v1` envelope, which `createLambdaHandler` routes to the `onEvent(DailyDigestCronV1, …)` handler.
3. Steps 8 and 9 (merging the PR and the revert PR).
</details>

## Learn more
`docs/guides/new-endpoint.md` · `docs/guides/new-resource.md` · `docs/guides/connect-projects.md` ·
EventBridge Scheduler expressions: https://docs.aws.amazon.com/scheduler/latest/UserGuide/schedule-types.html ·
next: [14 · Why this stack](14-why-this-stack.md)
