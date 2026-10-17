# 15 · Limits, trade-offs and roadmap

> **In one sentence:** dr4w is built for small, mostly idle web apps; here is what it's bad at today, how each limit could be lifted, and what is planned next.
> **Reading time:** ~8 min · **Level:** 🟢 beginner-friendly, 🔵 expert section marked

## Why this matters
Knowing the edges of a tool saves you from forcing it where it doesn't fit — and tells you which
upgrade to make when a project outgrows the defaults.

## The idea, simply
dr4w is a bicycle, not a truck: perfect for quick trips, cheap to keep, easy to park. If you
need to move furniture, you rent a van for that one job — you don't replace the bicycle.

## How it works in dr4w
| Limit today | Why | Upgrade path (per project) |
|---|---|---|
| **Heavy relational data** (joins, reports) | DynamoDB needs access patterns designed up front | Turn on the shared Aurora Postgres (`infra/platform/postgres.tf`) + `pg-database`; accept ~$1–3/month and ~15 s resume after a pause |
| **Long-running work** (> 10 s per request) | Lambda timeout is 10 s — for HTTP *and* event handlers, which share the one function; API Gateway caps a request at 30 s | A second, worker-style function for that project (a new module — the one deliberate exception to "one Lambda per project"), or an AWS Step Functions workflow (a managed multi-step job runner); respond immediately and poll |
| **Real-time / WebSockets** | HTTP API + Lambda is request/response | Cloudflare Durable Objects or API Gateway WebSocket APIs (new module needed) |
| **Very high traffic** | Lambda concurrency is 10 for the whole shared account (all projects and other work); throttle 50 rps / burst 100; Workers Free 100k `/api` requests/day for *all* Workers; one partition for hello's notes | get the quota raised (requested), set reserved concurrency per project, move to Workers Paid, raise the throttle, shard keys or add GSIs |
| **SEO / server rendering** | SPA renders in the browser | An SSR or static-generation framework on Workers for that project |
| **Multi-region / high availability** | single region `us-east-1` | DynamoDB global tables + a second API region; a big step, not planned |
| **User accounts / login** | v1 non-goal | Cognito or a Workers-side auth provider, checked in the Worker before proxying |
| **Queues** | `createLambdaHandler` doesn't route SQS messages yet | Add an SQS branch in `packages/api-kit/src/events.ts` (or a project-local wrapper) |
| **Safe previews** | no PR preview environments | per-PR stacks — state keys are already per environment (ADR 0014) |

### Roadmap (from `docs/STATUS.md`, 2026-10-15)
- **Next:** measure the real idle cost (~2026-10-22) and replace the estimate in `docs/costs.md`;
  set reserved concurrency to 10 per project once AWS approves the account's higher Lambda
  concurrency quota (requested; currently 10 for the whole account); run the
  first real idea through `/idea`.
- **Security hygiene:** the laptop's root access keys were deleted (2026-10-15); narrowing the
  unrelated `gha-sandbox`/`gha-prod` roles is prepared but deferred.
- **Likely improvements:** SQS routing in `api-kit`; an outbox or DynamoDB Streams for reliable
  event publishing; a dead-letter queue for event delivery; a live-projects page on the apex
  (the `dr4w.io` homepage lives in a separate repo, `Dr4wOne/dr4w-landpage`).

### Open questions
- Is the extra Worker hop's latency acceptable for API-heavy projects, or should those get a direct API domain?
- When the number of projects grows, do alarms (free up to 10) or the shared account's budget become the first pain?

## Try it
```bash
grep -A4 -E 'variable "(throttle_rate|throttle_burst|timeout_s|reserved_concurrency)"' infra/modules/project-api/variables.tf | grep -E 'variable|default'
```
Expected: the defaults behind several limits above — `50`, `100`, `10`, and `null`.

## 🔵 Expert notes
- **Failure modes to watch first:** a failed `PutEvents` after a successful write (no outbox);
  events older than an hour are dropped from delivery (no target DLQ; the archive allows replay);
  the hot `NOTE` partition; Lambda free tier shared with other workloads in the account.
- **What scales without changes:** static traffic (Workers static assets are free and unlimited) and
  idle projects. The number of projects does *not* scale freely: they share account-wide Lambda
  concurrency, the Workers Free daily quota, the 10 free alarms, SSM throughput and the bus.
- **What doesn't scale linearly:** alarms cost after 10; every shared-package change redeploys
  every project (CI time grows with project count).

## Common mistakes
- Raising the Lambda timeout to fit a long job — API Gateway still ends the request at 30 s.
- Turning on Postgres "just in case" — it's the only part with a cost while idle.

## Check yourself
1. A project needs a 2-minute report. What do you change?
2. Which limit would a sudden traffic spike hit first?
3. Why are user accounts not part of dr4w yet?

<details><summary>Answers</summary>

1. Accept the request quickly, do the work in an event/queue handler (or a workflow) with a longer timeout, and let the client poll for the result.
2. Lambda concurrency — today 10 for the whole account, shared by every project — shows up first, as
   errors; then API Gateway throttling (50 requests/s per project) and, over a day, the Workers Free plan's 100k requests.
3. They were a deliberate v1 non-goal to keep the platform small; the Worker is the natural place to add a check later.
</details>

## Learn more
`docs/STATUS.md` · `docs/decisions/README.md` · Lambda quotas: https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html ·
API Gateway quotas: https://docs.aws.amazon.com/apigateway/latest/developerguide/limits.html ·
back to the [Handbook contents](README.md)

## Beyond the monorepo: dr4w home

Not everything belongs on AWS. **dr4w home** controls devices in a home (a TV today, consoles next), so
its server has to run *in* the home, next to the devices, and must never be reachable from the
internet. It therefore lives in its own public repository,
[Dr4wOne/dr4w-home](https://github.com/Dr4wOne/dr4w-home), and borrows only what fits from this one:
TypeScript, Hono and zod at the boundary, Biome, the pinned `catalog:`, a static Cloudflare Worker for
its demo at `home.dr4w.io`, and the same habits (decisions as ADRs, `docs/STATUS.md`, outside judges).

| | A dr4w project | dr4w home |
|---|---|---|
| Runs on | Lambda + DynamoDB, behind a Worker | A computer at home (Node), plus a static demo Worker |
| Reached through | `https://<name>.dr4w.io` | The home network, or a private VPN (Tailscale) when away |
| Data | DynamoDB tables | A local config file with the owner's devices and scenes |
| Extends by | New projects (`pnpm new`) | New device adapters (`pnpm device:new`) |

Why it is separate, and why the old `tv` idea was dropped: [ADR 0018](../decisions/0018-home-hub-outside-the-monorepo.md).
