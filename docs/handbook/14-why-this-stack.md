# 14 · Why this stack

> **In one sentence:** every major choice optimizes for near-zero idle cost and low maintenance for one developer — each section names the alternatives, the downside we accept, and when we'd change our mind.
> **Reading time:** ~15 min · **Level:** 🔵 mostly expert; beginners can read the "chose / because" lines

## Why this matters
Decisions without reasons get undone by the next person who doesn't know them. This chapter is
the reasoning behind the stack; each decision's formal record is an ADR in `docs/decisions/`.

## The idea, simply
For a solo builder with many small, mostly idle projects, three things matter most: **it costs
nothing while unused, it rarely needs upkeep, and a new project is copy-and-go.** Speed at huge
scale matters less. Ratings below are relative (● low → ●●● high), judged on 2026-10-15.

## How it works in dr4w

### 1. One monorepo
| Option | Setup cost | Cross-project change | Maintenance |
|---|---|---|---|
| **Monorepo (chosen)** | ● | ● one PR | ● one CI, one lockfile |
| Repo per project | ●● | ●●● many PRs, versioned packages | ●●● N CIs, N lockfiles |

Downside: every shared-package change redeploys every project, and the repo grows. Revisit if a
project needs its own team or permissions — it can be extracted. ADR 0001.

### 2. TypeScript everywhere
One language for web, API, scripts and contracts; types flow from zod schemas to the browser.
Alternatives (Go/Python for the API) would split the shared contracts. Downside: Node cold starts
and bundle size. Revisit for CPU-heavy work. ADR 0001.

### 3. Vite + React SPA
| Option | Hosting | Fits Workers static assets | Complexity |
|---|---|---|---|
| **Vite + React SPA (chosen)** | static files | ●●● | ● |
| Next.js / SSR framework | server rendering | ● adapters needed | ●●● |
| Astro / static site | static files | ●●● | ●● for app-like UIs |

Downside: no server rendering, so weak SEO and a blank first paint until JS loads. Revisit for
content sites that need search traffic (chapter 15). ADR 0001.

### 4. Cloudflare Workers with static assets
| Option | Idle cost | Same-origin API proxy | Lock-in |
|---|---|---|---|
| **Workers + static assets (chosen)** | $0 | ●●● code in the Worker | ●● |
| Cloudflare Pages | $0 | ●● (Functions) | ●● |
| Vercel / Netlify | $0 hobby tier | ●● rewrites | ●● |
| S3 + CloudFront | ~$0 | ●● behaviors, more config | ●● (AWS) |

Chose Workers because one small file serves the SPA *and* proxies `/api/*` with a secret, custom
domains and certificates are automatic, and Cloudflare recommends Workers over Pages for new
projects. Downside: two clouds to understand, and every API call takes the extra hop. ADRs 0001, 0005.

### 5. One Lambda per project with Hono
| Option | Idle cost | Infra per endpoint | Cold starts | Long jobs |
|---|---|---|---|---|
| **Lambdalith + Hono (chosen)** | $0 | none | one per project | ✗ (≤ 10 s here) |
| Function per route | $0 | ●●● IAM, logs, alarms each | many | ✗ |
| Containers (ECS/Fargate) | ●●● always on | none | none | ✓ |
| Lambda container image / App Runner-style services | ●–●● | none | slower | partly |

Downside: one memory/timeout/permission set for all routes. Revisit when a route needs very
different limits or permissions. ADRs 0001, 0006, 0011.

### 6. DynamoDB on-demand as the default
| Option | Idle cost | Relational queries | Ops |
|---|---|---|---|
| **DynamoDB on-demand (chosen)** | ~$0 | ✗ design keys up front | ● |
| Aurora Serverless v2 (optional here) | ~$1–3 storage, scales to 0 | ✓ | ●● |
| Cloudflare D1 (SQLite) | $0 free tier | ✓ | ● but data lives in Cloudflare, API in AWS |
| Neon (serverless Postgres) | $0 free tier | ✓ | ● another vendor and account |

Downside: access patterns must be designed first; ad-hoc queries are hard. Revisit per project —
that's what the optional Postgres is for. ADRs 0001, 0015.

### 7. OpenTofu
| Option | Multi-provider | Language | Maturity / risk |
|---|---|---|---|
| **OpenTofu (chosen)** | ✓ | HCL | ●●● stable, open source |
| Terraform | ✓ | HCL | ●●● BSL license |
| SST v3 | ✓ (Pulumi-based) | TypeScript | ●● nicer DX; judged too risky as a long-lived base |
| AWS CDK | AWS only | TypeScript | ●●● but no Cloudflare |
| Pulumi | ✓ | TypeScript | ●●● state service or self-managed |

Downside: HCL is a second language; Cloudflare isn't managed by it in v1 (wrangler is). ADR 0001.

### 8. Same-origin proxy instead of an API domain with CORS
The Worker forwards `/api/*`, so the browser never sees AWS: no CORS, no second domain or
certificate, and a natural place for the origin secret. Alternative: `api.<sub>.dr4w.io` with an
API Gateway custom domain and CORS — one less hop, more setup per project. Downside: the origin
secret is a static bearer token (it never expires unless rotated, and rotation causes a short 403
window); IAM-signed requests or mTLS would be stronger but more complex. Revisit if latency or the
secret's weaknesses start to matter. ADRs 0001, 0007.

### 9. SSM Parameter Store instead of Secrets Manager
Standard parameters are free; Secrets Manager costs ~$0.40 per secret per month. We don't need
automatic rotation. Exception: the optional Postgres uses Secrets Manager because the Data API
requires it. ADRs 0001, 0015.

### 10. One shared AWS account (ADR 0003)
Chose the existing account to avoid setup. Downside, and the biggest hidden trade-off: projects
share its quotas (one account-wide Lambda concurrency pool of 1000, of which each project reserves 10), free tiers, budget and
the plan role's read access with unrelated workloads. A dedicated account under AWS Organizations
is free and would remove most of chapter 9's known gaps. Revisit before any real users arrive.

### 11. SSO + OIDC instead of access keys
Nothing long-lived to leak; CI's permissions are tied to this repo's immutable identity and the
`production` environment. Downside: a short setup on each new laptop (`aws sso login`).
ADRs 0002, 0012.

## Try it
Open `docs/decisions/README.md` and pick any row — each ADR has the same four parts: context,
decision, consequences, status.

## 🔵 Expert notes
- **The constraint that drives everything:** cost while idle. Anything with an hourly floor
  (containers, NAT, load balancers, provisioned databases) is off by default.
- **Biggest bets:** a lambdalith per project and DynamoDB-first. Both are easy to escape one
  project at a time (a second function, or the optional Postgres).
- **Cheapest reversals:** frontend host (only `wrangler.jsonc` + the proxy), secrets store.
- **Hardest reversal:** OpenTofu → another IaC tool (state migration for every stack).

## Common mistakes
- Re-deciding a choice in a PR without updating its ADR — add a new ADR instead (`/handoff`).

## Check yourself
1. What single constraint explains most of these choices?
2. Why not one Lambda per route?
3. When would a project use Postgres instead of DynamoDB?

<details><summary>Answers</summary>

1. Near-zero cost while idle (followed by low maintenance for one person).
2. Every function needs its own IAM role, logs and alarms; one Hono app keeps infra fixed and shares the cold start.
3. When it needs relational queries or ad-hoc reporting, accepting a small monthly storage cost.
</details>

## Learn more
`docs/decisions/README.md` · `docs/stack.md` · next: [15 · Limits, trade-offs and roadmap](15-limits-and-roadmap.md)
