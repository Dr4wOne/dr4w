# Security

## Who can do what
| Actor | How it authenticates | What it may do |
|---|---|---|
| You on the laptop | IAM Identity Center SSO, profile `dr4w` (role `HumanAdmin` = AdministratorAccess), `aws sso login --profile dr4w` | Everything; bootstrap is applied only from here |
| CI on pull requests | GitHub OIDC → `dr4w-ci-plan` (ReadOnlyAccess + state lock files) | `tofu plan` only |
| CI deploys | GitHub OIDC → `dr4w-ci-deploy`, trusted **only** for the `production` environment | Create/change `dr4w-*` resources; every role it creates must carry `dr4w-boundary`; cannot touch the CI roles, the boundary, or the state bucket's settings |
| A project's Lambda | Its own role `dr4w-<p>-prod-api` with `dr4w-boundary` | Only what its modules grant (its table, the bus, its SSM params) |
| Browsers | none (v1 has no user auth) | Public pages; `/api/*` only through the Worker |

OIDC trust uses the repo's **immutable** subject `repo:Dr4wOne@279559492/dr4w@1420042428:…`
(`infra/bootstrap/variables.tf`), so a deleted-and-recreated repo with the same name gets no access.
Roles and policies: `infra/bootstrap/ci-roles.tf`, `infra/bootstrap/boundary.tf`.

## Where every secret lives
| Secret | Home | Rotate with |
|---|---|---|
| Origin secret (Worker → API) | SSM SecureString `/dr4w/<p>/prod/origin_secret` + Worker secret `ORIGIN_SECRET` | `docs/guides/secrets.md` |
| Cloudflare API token `dr4w-ci` | GitHub environment secret `production/CLOUDFLARE_API_TOKEN` | `docs/guides/secrets.md` |
| Cloudflare account ID | GitHub environment secret (not sensitive, kept with the token) | — |
| AWS credentials | none stored — SSO sessions on the laptop, OIDC in CI | — |
| Optional Postgres app password | Secrets Manager `dr4w-<p>-prod-pg` (only with `pg-database`) | re-apply `pg-database` with `-replace` on its password |
| Local dev values | `apps/<p>/api/.env.local`, `apps/<p>/web/.dev.vars` (git-ignored, `dev-origin-secret`) | — |

OpenTofu state contains the origin secrets; it lives encrypted in `s3://dr4w-tfstate-809411919562`
(versioned, TLS-only, public access blocked), readable only by admins and the CI roles.

## The Worker ↔ API trust
The Worker adds `X-Origin-Secret` and drops any client-sent copy (`templates/project/web/worker/index.ts`).
The Lambda compares it in constant time and returns 403 otherwise; only `GET /api/health` is
exempt (`packages/api-kit/src/origin-secret.ts`). API Gateway throttles each project at 50 rps /
burst 100 so a leaked execute-api URL can't run up costs.

## Never commit
Secrets, tokens, `.env.local`, `.dev.vars`, `*.tfstate`, plan files. The repo is **public**;
GitHub secret scanning and push protection are on. Account IDs and role ARNs are fine to commit.

## Open security items
Tracked in `docs/STATUS.md` → Known issues (the broad
`gha-sandbox` trust in the shared account).
