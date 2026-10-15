# guestbook — tasks

- [x] T1 `pnpm new guestbook` — test: template tests pass
- [x] T2 Contracts `packages/contracts/src/guestbook.ts`: `Entry`, `CreateEntry` — test: schema accepts/rejects (in route tests)
- [x] T3 Data `api/src/data/entries.ts`: `createEntry`, `latestEntries(20)` (sk = `<createdAt>#<id>`) — test: route tests against dynamodb-local
- [x] T4 Routes `api/src/routes/entries.ts` (GET/POST) + `.route('/entries', entries)` — test: `entries.test.ts` (201, list order, 400s, 403 without secret)
- [x] T5 UI `web/src/App.tsx`: form + list — test: `App.test.tsx` (lists, signs)
- [x] T6 Smoke `web/e2e/smoke.spec.ts`: sign the guestbook through the Worker — test: Playwright locally against `pnpm dev guestbook`

Env: `TABLE_NAME` only (template). `tables.json`: template `main` (pk/sk) is enough.

Done = `pnpm check` + `pnpm infra:check` green, `pnpm dev guestbook` works.
