# Decisions (ADRs)

One file per decision, newest at the bottom. Format: Context · Decision · Consequences · Status.

| # | Decision | Date | Status |
|---|---|---|---|
| 0001 | [Baseline stack (locked in the spec)](0001-baseline-stack.md) | 2026-10-14 | Accepted |
| 0002 | [Public repo; deploys gated by the `production` environment](0002-public-repo-production-environment.md) | 2026-10-14 | Accepted |
| 0003 | [Use the existing shared AWS account](0003-single-shared-aws-account.md) | 2026-10-14 | Accepted |
| 0004 | [Biome for lint and format](0004-biome.md) | 2026-10-14 | Accepted |
| 0005 | [Run the real Worker locally with `@cloudflare/vite-plugin`](0005-real-worker-in-local-dev.md) | 2026-10-14 | Accepted |
| 0006 | [Mount each route file explicitly in `app.ts`](0006-explicit-route-mounting.md) | 2026-10-14 | Accepted |
| 0007 | [Origin secret in SSM, cached and refreshed on mismatch](0007-origin-secret-in-ssm.md) | 2026-10-14 | Accepted |
| 0008 | [Cross-project access is granted by the provider (`exposes`)](0008-exposes-grants.md) | 2026-10-14 | Accepted |
| 0009 | [Lambda reserved concurrency off by default](0009-reserved-concurrency-off-by-default.md) | 2026-10-14 | Accepted |
| 0010 | [Lambda code ships through an S3 artifacts bucket](0010-lambda-code-via-s3.md) | 2026-10-15 | Accepted |
| 0011 | [One Lambda per project also handles bus events](0011-single-lambda-handles-events.md) | 2026-10-15 | Accepted |
| 0012 | [Immutable OIDC subjects; reference the shared OIDC provider](0012-oidc-immutable-subject-shared-provider.md) | 2026-10-14 | Accepted |
| 0013 | [Tear down Workers via the Cloudflare API](0013-destroy-via-cloudflare-api.md) | 2026-10-15 | Accepted |
| 0014 | [No PR preview environments (for now)](0014-no-pr-previews.md) | 2026-10-15 | Accepted |
| 0015 | [Optional Postgres uses the RDS Data API](0015-postgres-via-data-api.md) | 2026-10-14 | Accepted |
| 0016 | [Platform uses subdomains only](0016-subdomains-only.md) | 2026-10-14 | Accepted |

New decision: copy the shape of any file, take the next number, link it from `docs/STATUS.md` → Recent decisions.
