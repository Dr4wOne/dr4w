---
description: Add an API endpoint — route file + zod schema in contracts + test
argument-hint: <project> <METHOD /path>
---

Add the endpoint `$2 $3` (arguments: $ARGUMENTS) to project `$1`. Target: < 5 minutes.

1. Resource = first path segment after `/api` (e.g. `/api/tags/:id` → `tags`).
2. Schemas: request/response zod in `packages/contracts/src/$1.ts` (create + export from
   `packages/contracts/src/index.ts` if missing). Reuse existing schemas where possible.
3. Route: `apps/$1/api/src/routes/<resource>.ts` exporting `export const <resource> = new Hono()…`
   chained handlers; validate with `validate('json' | 'param' | 'query', Schema)` from
   `@dr4w/api-kit`; return `c.json(body, status)` with explicit status codes. Data access goes in
   `apps/$1/api/src/data/<resource>.ts`. If the file exists, add the handler to the chain.
4. Mount (new resource only): one `.route('/<resource>', <resource>)` line in `apps/$1/api/src/app.ts`.
5. Test: `apps/$1/api/src/routes/<resource>.test.ts` using `call()` from `../../test/helpers.ts`
   — happy path, validation 400, not-found 404 where relevant, and 403 without the origin secret.
6. Run `pnpm --filter $1-api typecheck test` and `pnpm lint`. Show the new route + test.
