# Debugging production

**Goal:** find out why something broke in AWS or Cloudflare. Local AWS commands need
`aws sso login --profile dr4w` first.

## Logs
```bash
AWS_PROFILE=dr4w aws logs tail /aws/lambda/dr4w-<p>-prod-api --since 1h --format short
```
Every request logs one JSON line (`packages/api-kit/src/log.ts`): `requestId`, `method`, `path`,
`status`, `ms`. In CloudWatch Logs Insights:
```
fields @timestamp, @message | filter @message like /"level":"error"/ | sort @timestamp desc | limit 50
```
Worker logs: Cloudflare dashboard → Workers → `dr4w-<p>` → *Logs* (observability is on in `wrangler.jsonc`).

## An alarm email arrived
Alarms are `dr4w-<p>-prod-api-errors` (Lambda errors) and `dr4w-<p>-prod-api-5xx` (API 5xx), both
from `infra/modules/project-api/main.tf`. Read the logs above, then fix forward via PR or follow
`docs/guides/rollback.md`.

## A budget email arrived
See `docs/costs.md` → "If a budget alert arrives" (Cost Explorer steps and the emergency stop).

## Run the API locally against prod data
`pnpm dev:cloud <p>` — same code, real tables (see `docs/guides/local-dev.md`). Events are logged,
never published, so prod consumers are not triggered.

## A consumer missed events
`dr4w-bus-archive` keeps 7 days of events. EventBridge console → *Archives* → `dr4w-bus-archive`
→ *Start replay*, pick the time window and the consumer's rule (`dr4w-<consumer>-prod-from-<provider>`).
Consumers are idempotent by event id, so overlapping replays are safe.

## A deploy failed
Open the run: `gh run view <id> --log-failed`. Known causes and fixes: `docs/troubleshooting.md`.

## Common mistakes
- Reading truncated tool output: on this laptop the `rtk` hook shortens command output; use
  `rtk proxy <cmd>` when you need all of it.
- Forgetting the profile: there are no default credentials (by design). Always `AWS_PROFILE=dr4w`.
