# Status

**Last updated:** 2026-10-15 · as of `main` @ `baf72af` (+ branch `docs/memory-system`)
Update this file with `/handoff` at the end of every session.

## Live projects
| Project | URL | What | Since |
|---|---|---|---|
| hello | https://hello.dr4w.io | Notes CRUD; publishes `Note.Created.v1` | 2026-10-15 |
| echo | https://echo.dr4w.io | Counts hello's `Note.Created.v1` events | 2026-10-15 |

Platform: `dr4w-bus` (+ 7-day archive), `dr4w-alerts` (email confirmed), `dr4w-monthly` budget ($10).

## Milestones
M1 local skeleton · M2 bootstrap + platform · M3 first deploy (`hello`) · M4 second project +
events (`echo`) · M5 idea pipeline + polish — **all done** (2026-10-14/15). Original plan and
acceptance criteria: `docs/SPEC.md` §9. Dry run: `ideas/guestbook/` (idea → live in 12 m 39 s).

## In progress
- The dr4w Handbook (`docs/handbook/README.md`): **done**, last reviewed 2026-10-15 (beginner + expert reader tests; findings fixed in text, code items in the hardening backlog below).

## Next up
1. **~2026-10-22:** check real idle cost in Cost Explorer (`docs/costs.md`); replace the estimate.
2. When the Lambda quota reaches 1000 (AWS case open): set `reserved_concurrency = 10` in each `module "api"` (ADR 0009).
3. First real idea through `/idea`.

## Known issues / gaps vs spec
| Item | Impact | Where |
|---|---|---|
| Root access keys in `~/.aws/credentials` (default profile) | Spec DoD "no AWS keys anywhere" not met on the laptop | Delete in console + file |
| `gha-sandbox` / `gha-prod` (not dr4w) trust every `Dr4wOne` repo (`gha-sandbox` also any `main`) with PowerUserAccess | Shared-account risk | Narrow to blog + mockshop environments (policies prepared 2026-10-15) |
| Lambda quota 10 → reserved concurrency off | No per-project concurrency cap (throttling still on) | ADR 0009 |
| SQS messages are not routed by `createLambdaHandler` | `queue` module needs a project-local handler | `packages/api-kit/src/events.ts` |
| `queue`, `cron`, `bucket`, `pg-database` modules validated but never deployed | Untested in AWS | `infra/modules/README.md` |
| Idle cost not yet measured (estimate only) | Spec DoD item open | `docs/costs.md` |
| PR previews not built | By decision | ADR 0014 |
| Spec said private repo, dedicated Vite proxy, inline Lambda zips | Built differently | ADRs 0002, 0005, 0010 |

## Hardening backlog (from the handbook expert review, 2026-10-15)
Code/infra changes — each needs a PR, and the bootstrap items a laptop apply with a "go".

| Priority | Item | Where |
|---|---|---|
| P1 | echo swallows every cancelled transaction as a duplicate → check `CancellationReasons` for `ConditionalCheckFailed`, rethrow the rest | `apps/echo/api/src/data/counter.ts` |
| P1 | Failed event handlers are discarded after Lambda's 2 async retries → event-invoke config + SQS on-failure destination + target DLQ + `FailedInvocations` alarm | `infra/modules/event-subscription`, `project-api` |
| P1 | Plan role uses account-wide `ReadOnlyAccess` (data + state readable from any same-repo PR/branch) → scoped `dr4w-*` read policy | `infra/bootstrap/ci-roles.tf` |
| P1 | Deploy role can delete state object versions → deny `s3:DeleteObjectVersion` on the state bucket | `infra/bootstrap/ci-roles.tf` |
| P1 | Abuse cost: 403 floods still bill (~$185/month per project at the throttle) → Cloudflare rate limiting on `/api/*`, budget action / alarm that stops the Lambda | Cloudflare, `infra/platform` |
| P1 | hello list ignores pagination (> 1 MB silently incomplete) | `apps/hello/api/src/data/notes.ts` |
| P2 | Concurrency alarms (`Throttles`, `ConcurrentExecutions`); reserved concurrency once quota allows | `project-api` |
| P2 | PITR on by default; `on_demand_throughput` caps | `infra/modules/dynamo-table` |
| P2 | `events:source` condition on `PutEvents`; per-project prefixes in `dr4w-boundary` where feasible | `project-api`, `boundary.tf` |
| P2 | Build before assuming AWS roles (supply-chain exposure) | `.github/workflows/ci.yml`, `deploy.yml` |
| P2 | Emergency stop as a tofu variable (manual stop is undone by the next deploy) | `project-api` |
| P2 | `exposes` changes should redeploy consumers; scheduled all-projects plan for drift | `scripts/changed-projects.ts`, workflows |
| P2 | Origin secret: accept current + previous during rotation; keep last-known value if SSM fails | `packages/api-kit/src/origin-secret.ts` |
| P2 | Cloudflare token: expiry + rotation schedule; per-project scope if possible | `docs/guides/secrets.md` |
| P3 | Publish outbox (no duplicate notes on retry); dedicated AWS account | ADR 0003 |

## Recent decisions (highest number first)
1. [0017 Caveman and ponytail on by default](decisions/0017-caveman-and-ponytail-by-default.md)
2. [0016 Platform uses subdomains only](decisions/0016-subdomains-only.md)
3. [0015 Optional Postgres via the RDS Data API](decisions/0015-postgres-via-data-api.md)
4. [0014 No PR previews](decisions/0014-no-pr-previews.md)
5. [0013 Destroy via Cloudflare API](decisions/0013-destroy-via-cloudflare-api.md)
6. [0012 Immutable OIDC subject, shared provider](decisions/0012-oidc-immutable-subject-shared-provider.md)
7. [0011 One Lambda handles bus events](decisions/0011-single-lambda-handles-events.md)
8. [0010 Lambda code via S3](decisions/0010-lambda-code-via-s3.md)
9. [0009 Reserved concurrency off by default](decisions/0009-reserved-concurrency-off-by-default.md)
10. [0008 `exposes` grants](decisions/0008-exposes-grants.md)

All decisions: `docs/decisions/README.md`.
