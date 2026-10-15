---
description: Turn a spec into ideas/<slug>/02-tasks.md — ordered tasks ≤ 1h, each with its test
argument-hint: <slug>
---

Plan `ideas/$ARGUMENTS/01-spec.md` into `ideas/$ARGUMENTS/02-tasks.md`.

- Ordered checklist (`- [ ] T1 …`), each task ≤ 1 hour and independently verifiable, each with
  **its test** (Vitest route test via `test/helpers.ts` `call()`, component test, or Playwright
  smoke). First task: `pnpm new <project>` (or "existing project: <name>").
- Typical order: contracts (zod in `packages/contracts/src/<project>.ts`) → data layer
  (`api/src/data/`) → routes (`api/src/routes/` + one `.route()` line) → events → UI → infra
  blocks (`apps/<p>/infra/main.tf`) → smoke test (`web/e2e/smoke.spec.ts`).
- Note which `tables.json` keys / GSIs and env vars (`api/src/env.ts`) are needed.
- End with: "Done = `pnpm check` + `pnpm infra:check` green, `pnpm dev <project>` works".

Set `status: planned`, update `updated`. Suggest `/poc $ARGUMENTS`.
