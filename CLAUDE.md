# dr4w — agent guide

## Stack
- pnpm 12 + Turborepo monorepo, TypeScript ESM everywhere, Biome. Versions: `docs/stack.md`.
- `apps/<p>/web`: Vite + React SPA on a Cloudflare Worker that proxies `/api/*` (origin secret).
- `apps/<p>/api`: one Hono Lambda per project (Node 24, arm64) behind an API Gateway HTTP API.
- Data: DynamoDB on-demand (`apps/<p>/infra/tables.json`); events on EventBridge `dr4w-bus`.
- Infra: OpenTofu, modules in `infra/modules/`, deployed by GitHub Actions via OIDC.

## Never
- Run `tofu apply`/`destroy`, `wrangler deploy`, merge to `main`, or change AWS/Cloudflare/GitHub settings without an explicit "go".
- Commit secrets, `.env.local`, `.dev.vars`, state or plan files. The repo is **public**.
- Use the default AWS profile (root keys). Always `AWS_PROFILE=dr4w`.
- Add raw `resource` blocks to a project stack, wildcard IAM actions, NAT/VPC Lambdas/provisioned capacity/dashboards.
- Touch the `dr4w.io` apex or `www` (owned by `Dr4wOne/dr4w-landpage`).
- Add `minimumReleaseAgeExclude`: pin an older version in the `catalog:` instead.

## Commands
`pnpm check` · `pnpm infra:check` · `pnpm docs:check` · `pnpm run doctor` · `pnpm dev <p>` · `pnpm new <name>`.
Ship: branch → PR (`check` + `plan` must pass) → squash-merge = deploy (`docs/guides/deploy.md`).
Push: `git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push -u origin <branch>`.
The `rtk` hook truncates output: use `rtk proxy <cmd>` for `tofu plan` and anything you must read in full.

## Read X when Y
| When | Read |
|---|---|
| Starting a session | `docs/STATUS.md` (or run `/start`) |
| Looking for a file | `docs/repo-map.md` |
| Writing API/web code | `docs/conventions.md`, `docs/dos-and-donts.md` |
| Adding an endpoint / resource | `docs/guides/new-endpoint.md`, `docs/guides/new-resource.md`, `infra/modules/README.md` |
| Linking projects or events | `docs/guides/connect-projects.md` |
| Working inside a project | `apps/<p>/CLAUDE.md` (loaded automatically there) |
| Deploying, rolling back, destroying | `docs/guides/deploy.md`, `docs/guides/rollback.md`, `docs/guides/destroy-project.md` |
| Secrets, IAM, auth | `docs/security.md`, `docs/guides/secrets.md` |
| Something failed | `docs/troubleshooting.md`, `docs/guides/debugging-prod.md` |
| Costs | `docs/costs.md` |
| "Why is it like this?" | `docs/decisions/README.md` |
| Changing versions | `docs/stack.md` (update it too) |
| Idea pipeline, `/endpoint`, `/resource` | `ideas/README.md`, `.claude/commands/*.md` (one file per command) |

## Session protocol
- `/start` — first thing: briefing from `docs/STATUS.md`, recent commits and `git status`.
- `/where <topic>` — file paths for "where is X?".
- `/doc-check` — before merging: fix docs the diff made stale.
- `/handoff` — at the end, or before the context fills: update `docs/STATUS.md`, add an ADR for any
  decision, update stale docs, commit `docs: session handoff`.

**The repo is the memory.** Anything worth remembering goes into `docs/STATUS.md`, an ADR in
`docs/decisions/`, or the right doc — not only into chat or tool-specific memory — so it travels
with `git clone`. Docs are plain, complete English (rules: `docs/conventions.md` → Docs).
