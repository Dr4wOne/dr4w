# Add an API endpoint

**Goal:** a new route with a shared schema and a test. With Claude: `/endpoint <project> <METHOD /path>`
(`.claude/commands/endpoint.md`).

## Steps
1. Schema in `packages/contracts/src/<project>.ts` (export it from `packages/contracts/src/index.ts`).
2. Route file `apps/<project>/api/src/routes/<resource>.ts` exporting a chained `new Hono()`;
   validate with `validate(...)` from `@dr4w/api-kit`; return explicit status codes.
3. Data access in `apps/<project>/api/src/data/<resource>.ts`. Keep using the project's `main`
   table with a new partition key prefix (e.g. `pk = "ITEM"` next to hello's `pk = "NOTE"`);
   add a table or GSI to `infra/tables.json` only when an access pattern needs it.
4. New resource only: one `.route('/<resource>', <resource>)` line in `apps/<project>/api/src/app.ts`.
   The explicit line keeps the typed web client (`hc<AppType>`) in sync.
5. Test next to the route with `call()` from `apps/<project>/api/test/helpers.ts`.

6. Web (optional): call it with the typed client — `api.<resource>.$post({ json })` wrapped in
   `unwrap(...)` (`apps/hello/web/src/api.ts`, used in `apps/hello/web/src/App.tsx`).

## Real example
`apps/hello/api/src/routes/notes.ts` (CRUD) with `apps/hello/api/src/routes/notes.test.ts`;
schemas in `packages/contracts/src/hello.ts`.

## Verify
```bash
pnpm --filter <project>-api typecheck test
pnpm lint
```

## Common mistakes
- Forgetting the 403 test without the origin secret (every route except `GET /api/health` is protected).
- Defining the schema inside the route file — the web app can't share it then.
