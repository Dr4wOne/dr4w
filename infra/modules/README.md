# Module catalog

Projects compose these in `apps/<p>/infra/main.tf`. Every module names resources
`dr4w-<project>-<env>-…`, writes useful outputs to SSM `/dr4w/<project>/<env>/*`, and returns
`iam_statements` to pass to `project-api` (least privilege, no wildcard actions).

| Module | Creates | Outputs / grants |
|---|---|---|
| `project-api` | Lambda (Hono, nodejs24.x arm64) + HTTP API + logs + alarms + origin secret | `api_url`, `function_*` |
| `dynamo-table` | On-demand table from `tables.json` | `table_<key>_name`; read/write statements |
| `queue` | SQS + DLQ, optional Lambda consumer | `queue_<key>_url/arn`; send/receive statements |
| `bucket` | Private, TLS-only S3 bucket, optional expiry | `bucket_<key>_name`; object statements |
| `cron` | EventBridge Scheduler → project Lambda (`Cron.<name>.v1` envelope) | — |
| `event-subscription` | `dr4w-bus` rule → project Lambda (needs provider `exposes: events`) | — |
| `project-ref` | Reads another project's String outputs (needs `exposes`) | `outputs`, granted statements |
| `pg-database` | DB + role in the shared Aurora cluster (Data API), secret | `pg_database`, `pg_secret_arn`; Data API statements |

Examples: `apps/hello/infra` (api + table + events out), `apps/echo/infra` (api + table +
event-subscription + project-ref). Guide: `docs/connecting-projects.md`.
