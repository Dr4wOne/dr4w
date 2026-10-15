---
description: Build the plan locally — scaffold (pnpm new), implement tasks with tests, pnpm dev works
argument-hint: <slug>
---

Implement `ideas/$ARGUMENTS/02-tasks.md` locally. Follow `CLAUDE.md` conventions.

1. Read `00-idea.md`, `01-spec.md`, `02-tasks.md`. Project name = `project:` in the frontmatter.
2. New project: `pnpm new <project>` (it runs `pnpm install`). Existing project: work in place.
3. Work through the tasks **in order**; tick each `- [x]` in `02-tasks.md` when its test passes.
   - Schemas → `packages/contracts/src/<project>.ts` (export from `src/index.ts`).
   - Table keys → `apps/<p>/infra/tables.json` (local seed + OpenTofu both read it).
   - Infra → module blocks from `infra/modules/README.md` in `apps/<p>/infra/main.tf`.
   - Replace the template's health-only page with the real UI; keep an `<h1>`.
   - Extend `web/e2e/smoke.spec.ts` with the core user flow.
4. Verify: `pnpm check`, `pnpm infra:check`, then run `pnpm dev <project>` and exercise the main
   flow with curl through the Worker (`http://localhost:<ports.web>/api/...`); stop the dev
   servers afterwards (SIGINT the `scripts/dev.ts` process).
5. Nothing touches AWS/Cloudflare here. Set `status: poc`, update `updated`, and summarize what
   works and what's stubbed. Suggest `/launch $ARGUMENTS`.
