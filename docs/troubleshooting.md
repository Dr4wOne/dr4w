# Troubleshooting

Real problems hit while building dr4w (2026-10-14/15), newest first. Symptom → cause → fix.

| Symptom | Cause | Fix |
|---|---|---|
| `destroy.yml`: `wrangler delete` fails with `Authentication error [code: 10000]` on `/storage/kv/namespaces` | `wrangler delete` also lists KV namespaces; the `dr4w-ci` token has no KV permission (by design) | Fixed: `destroy.yml` deletes custom domains + the Worker via the Cloudflare API |
| A test that counts items fails only sometimes | Test files run in parallel against the same table | Assert `≥ before + n`, or use unique keys per test (`apps/guestbook` lesson) |
| `pnpm dev hello echo`: `EADDRINUSE 127.0.0.1:9229` | Two Vite dev servers both opened the Worker debugger port | Fixed: `inspectorPort: 9229 + ports.web − 5173` in each `web/vite.config.ts` |
| CI: one API test suite fails in global setup with `docker compose up` exit 130 | Two suites raced to start dynamodb-local | Fixed: race-safe `ensureDynamoLocal`; CI starts the container once first |
| OpenTofu: `Output refers to sensitive values` for an SSM ARN | Every `aws_ssm_parameter` value is marked sensitive, even `String` | Wrap with `nonsensitive()` for plain `String` params only (`infra/modules/pg-database`, `project-ref`) |
| Dependabot opens `@types/node` 24 → 26 | Types must match the Node 24 runtime | `.github/dependabot.yml` ignores `@types/node` major bumps |
| Dependabot PR's `plan` job fails | Dependabot runs get no OIDC token | `ci.yml` skips `plan` for `dependabot[bot]` (deploy still plans + applies after merge) |
| First deploy: `CreateFunction … decomposing request: bufio.Scanner: token too long` | AWS provider's request logging can't handle a multi-MB inline zip | Fixed: Lambda code ships via the per-project S3 artifacts bucket (`infra/modules/project-api`) |
| A `tofu plan` (or any command) looks oddly short; a file contains `... (N lines truncated)` | The laptop's `rtk` hook rewrites and truncates command output | `rtk proxy <cmd>` for full output |
| `aws configure sso` saved the result into an existing profile (here `agent-sandbox`) instead of creating `dr4w` | The CLI reuses a matching existing profile | Fix `~/.aws/config` by hand: a `[profile dr4w]` with `sso_session = dr4w`, `sso_account_id`, `sso_role_name` (backup made as `config.bak-*`) |
| CI roles can't be assumed (`Not authorized to perform sts:AssumeRoleWithWebIdentity`) | The repo uses GitHub's immutable OIDC subjects (`repo:Dr4wOne@<id>/dr4w@<id>:…`) | Trust policies use the immutable form (`infra/bootstrap/variables.tf`); check with `gh api repos/Dr4wOne/dr4w/actions/oidc/customization/sub` |
| `git push` over HTTPS: `could not read Username` | No git credential helper configured | `git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push`, or once: `gh auth setup-git` |
| Bootstrap would create a duplicate GitHub OIDC provider | The shared account already had one, used by other roles | Bootstrap only references it (`data "aws_iam_openid_connect_provider"`), never manages it |
| `pnpm install`: `ERR_PNPM_IGNORED_BUILDS` (esbuild, workerd) | pnpm 12 blocks dependency install scripts | Allow-list in `pnpm-workspace.yaml` → `allowBuilds` (`pnpm approve-builds <pkg>`) |
| `pnpm install` adds `minimumReleaseAgeExclude` or rejects the lockfile | pnpm's minimum release age (~1 day) rejects very new versions | Pin the previous version in the catalog; don't add excludes (`CLAUDE.md` rule) |
| dynamodb-local won't start: `address already in use 0.0.0.0:8000` | Another dev server on port 8000 | dynamodb-local is published on host port **8100** |
| `wrangler deploy` would need a confirmation prompt in CI | Interactive confirm in non-TTY | Use flags (`--force` for delete) or the API; never rely on prompts in CI |

Still unexplained or open: see `docs/STATUS.md` → Known issues.
