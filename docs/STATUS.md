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
- The dr4w Handbook (`docs/handbook/README.md`): H1 TOC + H2 chapters 1–11 written, diagrams validated (`pnpm docs:diagrams`); H3 (chapters 12–15, appendices, reader tests) next.

## Next up
1. **~2026-10-22:** check real idle cost in Cost Explorer (`docs/costs.md`); replace the estimate.
2. When the Lambda quota reaches 1000 (AWS case open): set `reserved_concurrency = 10` in each `module "api"` (ADR 0009).
3. First real idea through `/idea`.

## Known issues / gaps vs spec
| Item | Impact | Where |
|---|---|---|
| Root access keys in `~/.aws/credentials` (default profile) | Spec DoD "no AWS keys anywhere" not met on the laptop | Delete in console + file |
| `gha-sandbox` role (not dr4w) trusts every `Dr4wOne` repo's `main` with PowerUserAccess | Shared-account risk | Narrow its trust (ADR 0003) |
| Lambda quota 10 → reserved concurrency off | No per-project concurrency cap (throttling still on) | ADR 0009 |
| SQS messages are not routed by `createLambdaHandler` | `queue` module needs a project-local handler | `packages/api-kit/src/events.ts` |
| `queue`, `cron`, `bucket`, `pg-database` modules validated but never deployed | Untested in AWS | `infra/modules/README.md` |
| Idle cost not yet measured (estimate only) | Spec DoD item open | `docs/costs.md` |
| PR previews not built | By decision | ADR 0014 |
| Spec said private repo, dedicated Vite proxy, inline Lambda zips | Built differently | ADRs 0002, 0005, 0010 |

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
