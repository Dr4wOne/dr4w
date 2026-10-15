# Costs

Last checked: **2026-10-15**. These are **estimates** from pricing and resource counts; the real
idle number comes from Cost Explorer after a week (open task — `docs/STATUS.md`).

## What can cost money
| Item | Idle cost | Grows with | Guardrail |
|---|---|---|---|
| Lambda (arm64, 512 MB) | $0 | requests × duration (free tier: 1M req + 400k GB-s/month) | API Gateway throttle 50 rps / burst 100 per project |
| API Gateway HTTP API | $0 | ~$1 per million requests | same throttle |
| DynamoDB on-demand | ~$0 (cents of storage) | reads/writes, GB stored | on-demand only, no provisioned capacity |
| CloudWatch Logs | ~$0 | log volume | retention 14 days (module validation enforces ≤ 14) |
| CloudWatch alarms | $0 for the first 10 | 2 per project → ~$0.10/alarm/month after 5 projects | — |
| EventBridge bus + archive | ~$0 | events published, archive GB | archive retention 7 days |
| S3 (state + artifacts) | ~$0 | object size | artifacts expire after 30 days |
| SSM Standard parameters, SNS email, AWS Budgets (first 2) | $0 | — | — |
| Cloudflare Workers (free plan) | $0 | 100k requests/day limit | — |
| Aurora Serverless v2 (**off**) | ~$1–3/month storage + $0.40 secret when on | ACU-hours while awake | `enable_shared_postgres = false` by default; scales to 0 ACU |

**Current estimate (hello + echo + platform, idle): ≈ $0.00–0.10 / month.**
Never used: NAT gateways, load balancers, VPC Lambdas, provisioned capacity, CloudWatch dashboards.

## How to check real costs
1. AWS console → Billing → **Cost Explorer** → last 7/30 days, group by **Service**.
2. dr4w only: filter tag `managed-by = opentofu`, group by tag `project`. If the tag isn't
   listed, activate `project` once in Billing → *Cost allocation tags* (takes ~24 h).
3. The `dr4w-monthly` budget ($10, alerts at 50/80/100% + forecast) covers the **whole account**,
   which is shared with other work.

## If a budget alert arrives
1. Cost Explorer as above — find the service and project.
2. Usual causes: a request flood (throttled at 50 rps), a retry loop, a cron running too often,
   or Aurora turned on.
3. Emergency stop for one project's API (the static site keeps working):
   ```bash
   AWS_PROFILE=dr4w aws lambda put-function-concurrency --function-name dr4w-<p>-prod-api --reserved-concurrent-executions 0
   # undo: AWS_PROFILE=dr4w aws lambda delete-function-concurrency --function-name dr4w-<p>-prod-api
   ```
