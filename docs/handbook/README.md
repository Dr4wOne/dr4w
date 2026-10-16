# The dr4w Handbook

A guide to what dr4w is, how it works, and **why** it is built this way — for two readers at once:

- **Beginners** who know some JavaScript but not cloud, serverless, CI/CD or infrastructure as code.
  Read every chapter in order and skip the "🔵 Expert notes" boxes.
- **Experts** who want the design, the trade-offs and the limits. Skip "The idea, simply" and the
  primer, start at chapter 4.

The handbook explains concepts and reasons. Exact commands, versions and step lists live in the
reference docs (`docs/README.md`), and the handbook links to them instead of copying them.

> Status (2026-10-15): chapters 1–11 written (H2); chapters 12–15 and the appendices come next (H3).
> Diagrams are checked with `pnpm docs:diagrams`.

## Reading paths
| I am… | Read |
|---|---|
| New to all of this | 1 → 2 → 3 → 4 → 5–12 in order → 13 (tutorials) |
| Shipping a feature today | 1 → 4 → 13 part A → keep 11 open |
| Reviewing the architecture | 2 → 4 → 5–10 (expert notes) → 14 → 15 |

## Contents

### Part I — Orientation
| # | Chapter | In one line |
|---|---|---|
| 1 | What is dr4w | The problem (ideas → cheap live products), what you get, who it's for, and what it is *not* |
| 2 | The big picture | One-page tour from the laptop to GitHub to AWS + Cloudflare to users; the diagram legend; a map of the repo |

### Part II — Primer (experts skip)
| # | Chapter | In one line |
|---|---|---|
| 3 | Foundations in one sitting | Just enough about the web (DNS, HTTP, APIs, JSON), the cloud (servers vs serverless, pay-per-use, cold starts, regions vs edge) and shipping code (Git, PRs, CI/CD, infrastructure as code, monorepos) |

### Part III — How dr4w works
| # | Chapter | In one line |
|---|---|---|
| 4 | The journey of a request | Anchor chapter: one click on `hello.dr4w.io` followed step by step to DynamoDB and back |
| 5 | The application: Worker, Lambda and contracts | The React app and its proxy Worker, the origin secret, one Hono Lambda per project, middleware, zod validation, shared contracts |
| 6 | Data | DynamoDB keys and on-demand billing, `tables.json` as the single source of truth, `hello`'s and `echo`'s data models, and when the optional Postgres makes sense |
| 7 | Infrastructure as code | OpenTofu, state and locking, the bootstrap → platform → project layers, and how modules compose a project |
| 8 | Connecting projects | Reading another project's outputs vs reacting to its events, with the real `hello` → `echo` example and why handlers must be idempotent |
| 9 | Security | No long-lived keys: SSO on the laptop, OIDC in CI, roles, the permissions boundary, where secrets live, the Worker-to-API trust, throttling |
| 10 | Costs | What is billed, why an idle project costs almost nothing, the guardrails, today's numbers, and a "what if traffic grows 100×" table |
| 11 | Shipping and running | What runs on a PR vs on merge, changed-project detection, smoke tests, rollback; what `pnpm dev` starts and how local mirrors production; logs, alarms and destroying a project |

### Part IV — Working with dr4w
| # | Chapter | In one line |
|---|---|---|
| 12 | The idea pipeline and AI workflow | Spec-driven development, the idea stages and slash commands, how Claude is used here (`CLAUDE.md`, `/start`, `/handoff`), and the caveman/ponytail house rules |
| 13 | Tutorials | **A.** Ship your first feature on `hello` (endpoint, UI, test, PR, plan, merge, verify, roll back). **B.** Launch a new project that runs on a schedule and consumes `hello`'s events |

### Part V — Decisions and depth
| # | Chapter | In one line |
|---|---|---|
| 14 | Why this stack | Each major choice against its alternatives (cost, complexity, lock-in, developer experience, maintenance), the downside we accept, and when we'd revisit — linked to the ADRs |
| 15 | Limits, trade-offs and roadmap | What dr4w is bad at today (heavy relational data, long jobs, WebSockets, very high traffic, SEO/SSR, multi-region), the upgrade path for each, and what's next |

### Appendices
| | Appendix | In one line |
|---|---|---|
| A | Glossary | Every term in plain words, with the chapter that explains it |
| B | Cheat sheet | One page: daily commands, where things live, URLs |
| C | FAQ and further reading | Beginner and expert questions; curated official docs per technology |

## Diagrams (Mermaid, validated with `mmdc`)
| Diagram | Type | Ch. |
|---|---|---|
| System context (you, dr4w, GitHub, AWS, Cloudflare, users) | flowchart | 2 |
| Containers (Worker, API Gateway, Lambda, DynamoDB, SSM, EventBridge, Aurora) | flowchart + subgraphs | 2 |
| Repo map | mindmap | 2 |
| Request journey | sequenceDiagram | 4 |
| Worker routing (`/` vs `/api/*`) | flowchart | 5 |
| Inside the Lambda (middleware → route → data) | flowchart | 5 |
| Data models of `hello` and `echo` | erDiagram | 6 |
| IaC layers and state files | flowchart | 7 |
| Module composition of a project | flowchart | 7 |
| SSM read vs event flow | flowchart + sequenceDiagram | 8 |
| Trust boundaries and credentials | flowchart | 9 |
| Cost breakdown | table + xychart-beta | 10 |
| CI/CD pipeline (PR vs main) | flowchart | 11 |
| Branch and PR flow | gitGraph | 11 |
| Local vs production mapping | flowchart | 11 |
| Idea lifecycle | stateDiagram-v2 | 12 |

Colors are the same in every diagram (legend in chapter 2): AWS, Cloudflare, GitHub, local machine.

## Glossary terms (to be defined in Appendix A)
**Web:** browser · domain · subdomain · DNS · CNAME · HTTP · HTTPS/TLS · certificate · CDN / edge ·
frontend · backend · SPA · API · REST · endpoint · JSON · CORS · same origin · proxy · header · status code
**Cloud:** AWS · Cloudflare · region · serverless · function (Lambda) · cold start · pay-per-use ·
free tier · on-demand · throttling · concurrency · API Gateway · Worker · static assets
**Data:** database · DynamoDB · table · item · partition key · sort key · GSI · single-table design ·
TTL · transaction · idempotent · Postgres / Aurora · ACU · Data API
**Infra:** infrastructure as code · OpenTofu / Terraform · provider · resource · module · state ·
state lock · plan · apply · drift · SSM Parameter Store · SecureString · S3 · bucket
**Events:** event · event bus · EventBridge · rule · target · publish/subscribe · at-least-once ·
dead-letter queue · replay · archive · contract · versioned event · SQS · cron / schedule
**Security:** IAM · role · policy · least privilege · permissions boundary · SSO · IAM Identity Center ·
OIDC · access key · secret · origin secret · constant-time compare
**Delivery:** Git · branch · commit · pull request · merge · squash · CI/CD · GitHub Actions ·
workflow · job · environment · branch protection · smoke test · rollback · Dependabot
**Code:** TypeScript · Node.js · pnpm · monorepo · workspace · Turborepo · Vite · React · Hono ·
middleware · zod · schema · Vitest · Playwright · esbuild · bundle · lockfile · catalog
**Process:** spec-driven development · ADR · POC · YAGNI · slash command · `CLAUDE.md` · caveman · ponytail

## Notes on scope (agreed 2026-10-15)
The original prompt listed 24 chapters. This handbook merges them into 15 to stay maintainable:
the three primer chapters become chapter 3; reading paths move into this page; CI/CD, local
development and operations become chapter 11; the idea pipeline and AI workflow become chapter 12;
the two tutorials become chapter 13; limits and roadmap become chapter 15; further reading joins
the FAQ. The optional docs site (`docs.dr4w.io`) is out of scope for now.
