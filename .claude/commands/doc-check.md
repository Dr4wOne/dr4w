---
description: Before merging — find docs made stale by the current diff and fix them
---

Find and fix documentation that the current branch made stale.

1. `git diff --name-only main...HEAD` (plus uncommitted changes).
2. For each changed area, check the docs that describe it (use `docs/repo-map.md` + `docs/README.md`):
   - `pnpm-workspace.yaml` catalog, lock files, `.nvmrc`, `.opentofu-version`, `docker-compose.yml`, workflow SHAs → `docs/stack.md` (versions + "last checked").
   - `apps/<p>/**` → `apps/<p>/CLAUDE.md`, `apps/<p>/README.md`; new/removed project → root `README.md` Live projects, `docs/STATUS.md`.
   - `infra/modules/**` → `infra/modules/README.md`, `docs/guides/new-resource.md`, `docs/costs.md` if it can cost money.
   - `packages/api-kit/**`, `packages/contracts/**` → `docs/conventions.md`, `docs/dos-and-donts.md`, guides that quote them.
   - `.github/workflows/**` → `docs/guides/deploy.md`, `docs/security.md` (roles/secrets).
   - `infra/bootstrap/**` → `docs/security.md`, `docs/bootstrap.md`.
   - `scripts/**`, root `package.json` scripts → root `README.md` Daily commands, `docs/repo-map.md`.
   - `.claude/commands/**` → root `README.md`, `CLAUDE.md`, `ideas/README.md`.
   - Any of the above → the handbook chapters that describe it (docs/handbook, once it exists).
3. Check that quoted snippets and paths in those docs still match the code.
4. Fix what's stale (plain English, one home per fact), run `pnpm docs:check`, and list what you changed and why.
