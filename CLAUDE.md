# dr4w — notes for Claude

Read first: `docs/tasks.md` (where we are), `docs/architecture.md` (how/why), `docs/SPEC.md` (requirements + amendments).

## Rules
- Spec-driven: stop at every ⏸ in `docs/tasks.md` for approval.
- **Never** run `tofu apply`, `wrangler deploy`, or anything that changes AWS/Cloudflare/GitHub without an explicit "go".
- The repo is **public**: never commit secrets, tokens or `.env.local`/`.dev.vars`.
- Pin versions in the `catalog:` of `pnpm-workspace.yaml`; check current docs before adding a dependency.
- pnpm enforces a minimum release age; don't add `minimumReleaseAgeExclude` — pick an older version.
- Never touch the `dr4w.io` apex or `www` (owned by `Dr4wOne/dr4w-landpage`).

## Conventions
- TypeScript ESM everywhere; imports use `.ts` extensions; internal packages export source (no build step).
- Lint/format: Biome (`pnpm lint`, `pnpm format`). Single quotes, no semicolons.
- API: Hono with `basePath('/api')`; one file per resource in `src/routes/`, mounted in `src/app.ts` with `.route()` (keeps RPC types). Validate with `validate()` + zod schemas from `@dr4w/contracts`.
- Data access in `src/data/`; env vars only via `src/env.ts` (`parseEnv`).
- Tests: Vitest; API tests hit dynamodb-local via `test/helpers.ts` `call()` (adds the origin secret). Web component tests use `// @vitest-environment jsdom`.
- AWS names: `dr4w-<project>-<env>-<thing>`; SSM: `/dr4w/<project>/<env>/<key>`.
- Events: `source = dr4w.<project>`, `detail-type = <Entity>.<Event>.v<N>`; defined with `defineEvent` in `packages/contracts/src/events/`.

## Commands
`pnpm dev [project…]` · `pnpm new <name>` · `pnpm seed <project>` · `pnpm changed [base]` · `pnpm check`
