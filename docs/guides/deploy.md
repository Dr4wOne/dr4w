# Deploy

**Deploy = merge a PR to `main`.** There is no manual deploy step for projects.

## What happens
1. On the PR, `ci.yml` runs lint, typecheck, tests, build and `pnpm infra:check`, then plans the
   changed projects and comments the plan on the PR. Both `check` and `plan` must pass (branch protection).
2. On merge, `deploy.yml` finds the changed projects (`scripts/changed-projects.ts`; a change in
   `packages/` or `infra/modules/` means *all* projects), sorts providers before consumers, and for
   each one: `tofu apply` → `wrangler deploy --var API_ORIGIN:… --secrets-file …` → waits for the
   custom domain → Playwright smoke test (`apps/<p>/web/e2e/smoke.spec.ts`).

## Steps
```bash
git checkout -b feat/<what>
# … change code, run: pnpm check && pnpm infra:check
git push -u origin feat/<what>        # push command: docs/conventions.md → Git
gh pr create --fill
gh pr checks --watch                  # then read the plan comment
gh pr merge --squash --delete-branch
gh run watch $(gh run list --workflow deploy.yml --limit 1 --json databaseId -q '.[0].databaseId')
```

## Redeploy without a code change
`gh workflow run deploy.yml -f project=<p>` (empty `project` = all projects).

## Shared infrastructure
- **Platform** (`infra/platform`: bus, alerts, budget, optional Postgres): PR the change, then
  Actions → **platform** → run with `apply` unticked (plan only), check the log, run again with `apply`.
- **Bootstrap** (`infra/bootstrap`: state bucket, CI roles, permissions boundary): only from the
  laptop with admin SSO — `cd infra/bootstrap && tofu init -backend-config=../backend.hcl && tofu plan`,
  then `tofu apply`. CI cannot change its own roles, by design.

## Verify
`curl -s https://<subdomain>.dr4w.io/api/health` returns `{"ok":true,…}` and the deploy run is green.

## Common mistakes
- Expecting a docs-only PR to deploy: projects deploy only when their files (or shared paths) change.
- A plan that shows deletes you didn't expect — stop and read it before merging.
