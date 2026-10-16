# Appendix C · FAQ and further reading

## Beginner questions
**Do I need an AWS account to try dr4w?** No. `pnpm dev hello` runs everything locally
(chapter 11). You need AWS access only to look at or change production.

**Why does the site work if I never deployed it myself?** Merging a PR on GitHub runs
`deploy.yml`, which deploys for you (chapter 11).

**Where do I put a new page?** In `apps/<p>/web/src/` (React). If it needs data, add an endpoint
first (`docs/guides/new-endpoint.md`, chapter 13 A).

**What is `pk` / `sk`?** The two-part address of a DynamoDB item (chapter 6).

**Why can't I call the AWS URL directly?** The API only accepts requests that carry the Worker's
secret, so direct calls get 403 (chapters 4 and 9).

**Does it cost money while I'm not using it?** Almost nothing — estimated $0.00–0.10/month idle (chapter 10).

## Expert questions
**Why not Next.js on Vercel?** No SSR need yet, and the Worker doubles as the API proxy. See chapter 14 §3–4.

**How do you avoid double-processing events?** Handlers are idempotent by event id inside one
DynamoDB transaction (`apps/echo/api/src/data/counter.ts`, chapter 8).

**What happens if `PutEvents` fails after the write?** The request fails with 500 after the note
was saved; there is no outbox yet (chapter 15).

**Can CI escalate its own permissions?** No: bootstrap (which defines CI's roles) is applied only
from the laptop, every role CI creates carries `dr4w-boundary`, and explicit denies protect the
CI roles and the boundary (chapter 9, `infra/bootstrap/ci-roles.tf`).

**How are cross-project permissions enforced?** By the provider's `exposes`, checked in CI and by
plan-time preconditions (chapter 8, ADR 0008).

**What breaks first under load?** API Gateway throttling (50 rps), then the Workers Free daily
limit, then hot DynamoDB partitions (chapter 15).

## Further reading
| Topic | Official docs |
|---|---|
| Cloudflare Workers + static assets | https://developers.cloudflare.com/workers/static-assets/ |
| AWS Lambda | https://docs.aws.amazon.com/lambda/latest/dg/welcome.html |
| API Gateway HTTP APIs | https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api.html |
| DynamoDB | https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html |
| EventBridge | https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-what-is.html |
| OpenTofu | https://opentofu.org/docs/ |
| Hono | https://hono.dev/docs/ |
| zod | https://zod.dev |
| React | https://react.dev |
| Vite | https://vite.dev/guide/ |
| pnpm workspaces | https://pnpm.io/workspaces |
| GitHub Actions + OIDC | https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/about-security-hardening-with-openid-connect |
| Claude Code | https://code.claude.com/docs |
