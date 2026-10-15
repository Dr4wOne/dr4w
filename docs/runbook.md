# Runbook

Day-2 operations. Local AWS commands use the SSO profile: `aws sso login --profile dr4w`,
then `export AWS_PROFILE=dr4w`. Never use the default (root) credentials.

| Situation | Go to |
|---|---|
| A deploy broke something | [Roll back](#roll-back) |
| Remove a project | [Destroy a project](#destroy-a-project) |
| Secret leaked / periodic hygiene | [Rotate the origin secret](#rotate-a-projects-origin-secret), [Rotate the Cloudflare token](#rotate-the-cloudflare-api-token) |
| Email from `dr4w-alerts` | [Alarm](#an-alarm-fired), [Budget](#a-budget-alert-arrived) |
| Consumer missed events | [Replay events](#replay-events-from-the-archive) |
| Shared infra change | [Platform & bootstrap changes](#platform--bootstrap-changes) |

---

## Roll back

**Preferred — revert and redeploy (code + infra):**
```bash
git revert <bad-merge-sha>        # on a branch
gh pr create --fill               # CI plans it; merge → deploy.yml redeploys the old state
```

**Fastest — re-run an older successful deploy:** Actions → *deploy* → pick the last good run →
*Re-run all jobs*. A re-run uses **that run's commit**, so Lambda, infra and Worker go back
together. Then revert on `main` too, or the next merge brings the bad code back.

**Frontend only:** Cloudflare dashboard → Workers → `dr4w-<project>` → *Deployments* → roll back
to a previous version (equivalent to `wrangler rollback`). Lambda/API stay as they are.

Data is not rolled back by any of these. DynamoDB has no PITR by default (cost); if a project
needs it, set `point_in_time_recovery` in the `dynamo-table` module first.

## Destroy a project

1. Remove links: no other project may list it in `uses` (and drop its `exposes` entries).
   Merge that first.
2. Actions → **destroy** → *Run workflow*: `project = <name>`, `confirm = <name>`.
   It removes the Worker's custom domain and the Worker (Cloudflare API), lifts DynamoDB
   deletion protection, then
   `tofu destroy`s the stack (Lambda, API, tables, SSM params, alarms, artifacts bucket).
3. PR deleting `apps/<name>/` (and setting the idea's `status: dropped`). Merging deploys nothing.
4. Optional: delete the leftover state object
   `s3://dr4w-tfstate-809411919562/projects/<name>/prod/terraform.tfstate` (it's tiny; keeping it is harmless).

## Rotate a project's origin secret

The Worker ↔ Lambda shared secret lives in SSM `/dr4w/<p>/prod/origin_secret` and as the
Worker secret `ORIGIN_SECRET`.
```bash
cd apps/<p>/infra
pnpm --filter <p>-api build
tofu init -backend-config=../../../infra/backend.hcl
tofu apply -replace=module.api.random_password.origin_secret     # new value in SSM
gh workflow run deploy.yml -f project=<p>                          # pushes it to the Worker
```
Between the two steps (~2–3 min) the site's `/api/*` returns 403. Warm Lambdas pick the new
value up by themselves (they re-read SSM on a mismatch, at most once a minute).

## Rotate the Cloudflare API token

1. Cloudflare → *My Profile* → *API Tokens* → **Roll** the `dr4w-ci` token (same permissions;
   see `docs/bootstrap.md` §3), or create a new one and delete the old.
2. `gh secret set CLOUDFLARE_API_TOKEN --env production --repo Dr4wOne/dr4w` (paste).
3. Update any local copies (e.g. `~/workspace/*/.env`).
4. Verify: Actions → deploy → *Run workflow* (`project = hello`) succeeds.

## An alarm fired

Alarms: `dr4w-<p>-prod-api-errors` (Lambda errors) and `dr4w-<p>-prod-api-5xx` (API 5xx).
```bash
aws logs tail /aws/lambda/dr4w-<p>-prod-api --since 1h --format short | grep -E '"level":"(error|warn)"'
```
Logs are JSON lines (`requestLogger`, `log()`), so in CloudWatch Logs Insights:
```
fields @timestamp, @message | filter @message like /"level":"error"/ | sort @timestamp desc | limit 50
```
Fix forward via PR, or [roll back](#roll-back).

## A budget alert arrived

The budget covers the **whole account** (shared with non-dr4w work).
1. Billing → *Cost Explorer* → group by **Service**, then filter tag `managed-by = opentofu` and
   group by tag `project` (activate the `project` cost-allocation tag once in Billing → *Cost
   allocation tags* if it's not listed).
2. Usual suspects: a request flood (API Gateway throttles at 50 rps / burst 100), a runaway cron
   or retry loop, or Aurora if `enable_shared_postgres` was turned on.
3. Emergency stop for one project's API (static site keeps working):
   ```bash
   aws lambda put-function-concurrency --function-name dr4w-<p>-prod-api --reserved-concurrent-executions 0
   # undo: aws lambda delete-function-concurrency --function-name dr4w-<p>-prod-api
   ```

## Replay events from the archive

`dr4w-bus-archive` keeps 7 days of every event. EventBridge console → *Archives* →
`dr4w-bus-archive` → *Start replay*, choose the window and the rule(s) of the consumer
(`dr4w-<consumer>-prod-from-<provider>`). Consumers are idempotent by event id, so overlaps are safe.

## Platform & bootstrap changes

- **Platform** (`infra/platform`: bus, alerts, budget, optional Postgres): PR the change, then
  Actions → **platform** → run with `apply` unticked (plan), review the log, run again with `apply`.
- **Bootstrap** (`infra/bootstrap`: state bucket, CI roles, boundary) — only from the laptop with
  admin SSO: `cd infra/bootstrap && tofu init -backend-config=../backend.hcl && tofu plan && tofu apply`.
  CI can't (and must not be able to) change its own roles.

## Lambda concurrency

Once the account quota is ≥ 1000 (`aws service-quotas get-service-quota --service-code lambda
--quota-code L-B99A9384`), set `reserved_concurrency = 10` in each `module "api"` block (cost cap).
