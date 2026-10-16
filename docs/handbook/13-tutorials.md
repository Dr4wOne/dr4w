# 13 · Tutorials

> **In one sentence:** two hands-on walkthroughs — A (this page) adds a feature to `hello` end to end; [B](13b-tutorial-new-project.md) launches a new project that runs on a schedule and reacts to `hello`'s events.
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

## Common mistakes
- Declaring `/:id` before a fixed path like `/count` (tutorial A, step 3).

## Check yourself
1. Why must `.get('/count')` come before `.get('/:id')`?
2. Which steps of tutorial A change production?
3. What does the plan's "1 to add, 1 to change, 1 to destroy" mean here?

<details><summary>Answers</summary>

1. Hono matches routes in order; `/:id` would match `count` first and reject it as an invalid uuid.
2. Steps 8 and 9 (merging the PR and the revert PR).
3. A new code zip in S3 is added, the old one is destroyed, and the Lambda is changed to use the new one.
</details>

## Learn more
`docs/guides/new-endpoint.md` · `docs/guides/new-resource.md` · `docs/guides/connect-projects.md` ·
EventBridge Scheduler expressions: https://docs.aws.amazon.com/scheduler/latest/UserGuide/schedule-types.html ·
next: [Tutorial B · Launch a new project](13b-tutorial-new-project.md)
