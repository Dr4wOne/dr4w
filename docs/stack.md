# Stack

Every tool, library and service in dr4w, with the version **pinned in the repo**.
Last checked: **2026-10-15** (pnpm catalog in `pnpm-workspace.yaml`, `pnpm-lock.yaml`,
`.terraform.lock.hcl` files, `.opentofu-version`, `.nvmrc`, `docker-compose.yml`, workflow SHAs).
Update this file whenever the catalog or a lock file changes (`/doc-check` flags it).

## Runtime and tooling
| Tool | Version | Why | Docs |
|---|---|---|---|
| Node.js | 24 (`.nvmrc`; Lambda `nodejs24.x`) | One runtime locally and on Lambda | https://nodejs.org/docs/latest-v24.x/api/ |
| pnpm | 12.11.2 (`packageManager`) | Workspaces, catalogs, strict installs, release-age policy | https://pnpm.io |
| Turborepo | 2.11.8 | Task graph + caching (`turbo.json`) | https://turborepo.com/docs |
| TypeScript | 7.0.2 | Types everywhere; `tsc` is typecheck-only | https://www.typescriptlang.org/docs/ |
| tsx | 4.23.15 | Runs TS scripts and the local API | https://tsx.is |
| esbuild | 0.28.2 | Bundles each Lambda (`scripts/build-lambda.ts`) | https://esbuild.github.io |
| Biome | 2.5.15 | Lint + format (`biome.json`) | https://biomejs.dev |
| Vitest | 5.0.4 | Unit, route and component tests | https://vitest.dev |
| Playwright | 1.64.1 | Smoke tests against deployed URLs | https://playwright.dev |
| OpenTofu | 1.13.1 (`.opentofu-version`) | Infrastructure as code | https://opentofu.org/docs/ |
| Docker | any recent (compose v2) | dynamodb-local, optional Postgres | https://docs.docker.com |
| AWS CLI | ≥ 2.9 (laptop: 2.38.1) | SSO login, ops commands | https://docs.aws.amazon.com/cli/ |
| GitHub CLI | recent (laptop: 2.102.0) | PRs, workflows, secrets | https://cli.github.com/manual/ |

## Libraries (pnpm catalog)
| Library | Version | Used for |
|---|---|---|
| hono | 4.13.13 | API routing (Lambda + Node), typed client `hono/client` |
| @hono/node-server | 2.1.5 | Local API server (`src/local.ts`) |
| @hono/zod-validator | 0.9.1 | `validate()` in `packages/api-kit` |
| zod | 4.6.7 | Schemas in `packages/contracts`, env parsing |
| @aws-sdk/client-dynamodb, lib-dynamodb, client-eventbridge, client-ssm | 3.1150.0 | Data, events, secrets |
| react, react-dom | 19.3.0 | Web UI |
| vite | 8.3.4 | Dev server + build |
| @vitejs/plugin-react | 6.1.2 | React in Vite |
| @cloudflare/vite-plugin | 1.64.0 | Runs the real Worker in dev; build output for wrangler |
| wrangler | 4.151.0 | Deploys Workers (CI only) |
| @cloudflare/workers-types | 5.20261014.1 | Worker types |
| @testing-library/react / dom, jsdom | 16.3.3 / 10.4.2, 30.1.2 | Component tests |
| @types/node, @types/react(-dom), @types/aws-lambda | 24.19.2, 19.3.0, 8.10.164 | Types |

## OpenTofu providers (lock files)
| Provider | Version |
|---|---|
| hashicorp/aws | 6.69.0 (constraint `~> 6.69`) |
| hashicorp/random | 3.9.1 |
| hashicorp/archive | 2.8.1 |

## Container images (`docker-compose.yml`)
`amazon/dynamodb-local:3.3.1` · `postgres:17.11-alpine` (profile `pg`).

## GitHub Actions (pinned to commit SHAs)
actions/checkout v7.0.1 · actions/setup-node v7.1.0 · pnpm/action-setup v6.1.0 ·
aws-actions/configure-aws-credentials v6.3.0 · opentofu/setup-opentofu v2.0.2.

## Cloud services
| Service | Role | Plan |
|---|---|---|
| Cloudflare Workers + Static Assets | Hosts each SPA, proxies `/api/*`, custom domains on `dr4w.io` | Free |
| AWS Lambda (arm64) + API Gateway HTTP API | One API per project | Pay per use |
| DynamoDB on-demand | Default database | Pay per use |
| EventBridge (`dr4w-bus` + archive) | Cross-project events | Pay per use |
| SSM Parameter Store (Standard) | Config and secrets | Free tier |
| S3 | OpenTofu state, Lambda artifacts | Pay per use |
| CloudWatch Logs + alarms, SNS, AWS Budgets | Ops | Mostly free tier (`docs/costs.md`) |
| Aurora Serverless v2 PostgreSQL | Optional shared DB, **off** | Storage cost when on |
| IAM Identity Center, GitHub OIDC | Auth without long-lived keys | Free |

Why each choice was made: `docs/decisions/`.
