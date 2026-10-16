# Appendix A · Glossary

Plain-word definitions. **Ch.** = the handbook chapter that explains the term in context.

| Term | Meaning | Ch. |
|---|---|---|
| ACU | Aurora Capacity Unit: how much compute the Postgres database uses at a moment; 0 = paused | 6 |
| ARN | Amazon Resource Name: the unique ID AWS gives every resource, e.g. a Lambda's `function_arn` | 3, 7 |
| ADR | Architecture Decision Record: a short file explaining one decision and its trade-offs (`docs/decisions/`) | 14 |
| API | A set of URLs a program offers so other programs can use it, e.g. `GET /api/notes` | 3 |
| API Gateway | AWS service that receives HTTP requests and hands them to a Lambda | 4 |
| Archive | A saved copy of past events on the bus, kept 7 days, that can be replayed | 8 |
| At-least-once | A delivery promise: every event arrives, but sometimes more than once | 8 |
| AWS | Amazon Web Services, the cloud that runs dr4w's APIs and data | 2 |
| Backend | Code that runs on servers (here: the Lambda), not in the browser | 3 |
| Branch | A separate line of work in Git, merged later | 3 |
| Branch protection | A GitHub rule that blocks changes to `main` unless checks pass | 11 |
| Browser | The program people use to open websites | 3 |
| Bucket | A container for files in S3 | 7 |
| Bundle | All of a program's code combined into one file for deployment | 5 |
| Catalog (pnpm) | The single list of dependency versions in `pnpm-workspace.yaml` (`docs/stack.md`) | — |
| CDN / edge | A network of servers close to users that serves files quickly | 3 |
| Certificate | A file proving a website's identity, needed for HTTPS | 3 |
| CI/CD | Continuous integration and delivery: robots test every change and deploy merged ones | 3, 11 |
| `CLAUDE.md` | The instructions file Claude reads at the start of every session | 12 |
| Cloudflare | The edge network that serves dr4w's pages and runs the Workers | 2 |
| CNAME | A DNS record that makes one name an alias of another; a subdomain that already has one can't become a Worker custom domain | — |
| Cold start | The extra delay when a serverless function starts after being idle | 3, 4 |
| Commit | A saved change in Git, with a message | 3 |
| Concurrency | How many copies of a function run at the same time | 10, 15 |
| Constant-time compare | Comparing secrets in a way that doesn't leak hints through timing | 5 |
| Contract | The agreed shape of data between two parts, written as a zod schema | 5, 8 |
| CORS | Browser rules for calling an API on a different site; dr4w avoids them by using one site | 2, 14 |
| Cron / schedule | Running something at fixed times, e.g. every night | 13 |
| Database | A program that stores data so it can be found again | 6 |
| Dead-letter queue (DLQ) | A place where messages go after they fail too many times | 8 |
| Dependabot | GitHub's robot that proposes dependency updates | 11 |
| DNS | The internet's phone book: turns names into server addresses | 3 |
| Domain / subdomain | A site's name (`dr4w.io`) / a name under it (`hello.dr4w.io`) | 3 |
| Drift | When real cloud resources no longer match the infrastructure code | 7 |
| DynamoDB | AWS's key-value database; dr4w's default data store | 6 |
| Endpoint | One URL + method in an API, e.g. `POST /api/notes` | 5 |
| Envelope | The standard wrapper every event travels in: `id`, `source`, `detail-type`, `time`, `detail` | 8 |
| execute-api URL | API Gateway's own AWS address; only the Worker calls it | 2, 4 |
| Environment (GitHub) | A named deploy target (`production`) with its own rules and secrets | 9, 11 |
| esbuild | A fast tool that bundles TypeScript into one JavaScript file | 5 |
| Event | A message saying something happened, e.g. `Note.Created.v1` | 8 |
| Event bus / EventBridge | AWS service that delivers events from publishers to subscribers; ours is `dr4w-bus` | 8 |
| Free tier | Usage a provider gives away each month | 10 |
| Frontend | Code that runs in the browser (here: the React app) | 3 |
| Git / GitHub | Version control / the website that hosts the repo and runs Actions | 3 |
| GitHub Actions / workflow / job | GitHub's automation; a workflow file has jobs made of steps | 11 |
| GSI | Global secondary index: an extra way to look up DynamoDB items | 6 |
| GB-s (GB-second) | Lambda's compute unit: memory in GB × seconds the code ran | 10 |
| Header | Extra information sent with an HTTP request or response | 4 |
| Hono | The small web framework that routes API requests in dr4w | 5 |
| Hook (Claude Code) | A small script Claude Code runs automatically on an event, such as each prompt | 12 |
| HTTP / HTTPS / TLS | The web's request/response language / the encrypted version / the encryption | 3 |
| IAM | AWS Identity and Access Management: who may do what | 9 |
| IAM Identity Center / SSO | AWS sign-in that hands out short-lived credentials (single sign-on) | 9 |
| Idempotent | Doing it twice has the same effect as doing it once | 6, 8 |
| Infrastructure as code (IaC) | Describing cloud resources in files instead of clicking in a console | 3, 7 |
| Item / table | One record / a collection of records in DynamoDB | 6 |
| JSON | Text format for data, e.g. `{"title":"hi"}` | 3 |
| Lambda | AWS's serverless functions; each dr4w project has one | 5 |
| Lambdalith | One Lambda that serves all of a project's routes | 5, 14 |
| Least privilege | Giving each role only the permissions it needs | 9 |
| Lockfile | A file that pins exact dependency versions (`pnpm-lock.yaml`, `.terraform.lock.hcl`); not the same as a *state lock* | 7 |
| Manifest | `project.json`: a project's name, subdomain, links to other projects and local ports | 2 |
| Matrix (CI) | One CI job definition run once per item, e.g. once per changed project | 11 |
| Merge / squash | Applying a PR to `main` / combining its commits into one | 11 |
| Middleware | Code that runs before every route, e.g. logging or the secret check | 5 |
| Module | A reusable infrastructure building block in `infra/modules/` | 7 |
| Monorepo / workspace | One repo holding many projects / pnpm's way of linking them | 3 |
| Node.js | The JavaScript runtime used locally and on Lambda | 4, 5 |
| OIDC | A standard that lets GitHub prove a job's identity to AWS without stored keys | 9 |
| On-demand / pay-per-use | Billing per request instead of per hour | 3, 10 |
| OpenTofu / Terraform | The infrastructure-as-code tool dr4w uses / the tool it forked from | 7 |
| Origin secret | The shared secret the Worker adds so the API knows the request came through it | 4, 9 |
| Partition key / sort key | The two parts of a DynamoDB item's address (`pk`, `sk`) | 6 |
| Permissions boundary | A ceiling on what any role created by CI can ever do (`dr4w-boundary`) | 9 |
| Plan / apply | Preview infrastructure changes / make them | 7 |
| Playwright / smoke test | Browser-testing tool / a quick test that the live site basically works | 11 |
| pnpm / Turborepo | Package manager / task runner with caching | 1 |
| POC | Proof of concept: a first working version, local only in dr4w | 12 |
| Policy / role | A list of allowed actions / an identity that carries policies | 9 |
| Postgres / Aurora / Data API | Relational database / AWS's managed version / calling it over HTTP | 6 |
| Provider (OpenTofu) | The plug-in that talks to one cloud's API | 7 |
| Provider / consumer (projects) | The project that offers events or data / the project that uses them | 8 |
| Proxy | A middleman that forwards requests (the Worker for `/api/*`) | 4, 5 |
| Publish / subscribe | Sending events without knowing who listens / signing up to receive them | 8 |
| Pull request (PR) | A proposal to merge a branch, checked before merging | 3, 11 |
| React / Vite | UI library / dev server and build tool for the web app | 5 |
| Region | A group of AWS data centers; dr4w uses `us-east-1` | 3 |
| Replay | Sending archived events again | 8 |
| Resource | One cloud thing managed by OpenTofu (a table, a role…) | 7 |
| REST | A common style of HTTP APIs using URLs and methods | 3 |
| Rollback | Returning production to an earlier version | 11 |
| Rule / target | An EventBridge filter for events / where matching events go | 8 |
| S3 | AWS file storage; holds OpenTofu state and Lambda code | 7 |
| Same origin | Page and API share one domain, so no CORS is needed | 2, 4 |
| Schema / zod | A description of data's shape / the library dr4w uses to write and check them | 5 |
| Secret / SecureString | A value that must stay private / SSM's encrypted parameter type | 9 |
| Serverless | Running code without managing servers, billed per use | 3 |
| Single-table design | Storing several kinds of items in one DynamoDB table with generic keys | 6 |
| Slash command | A Claude command such as `/idea`, defined in `.claude/commands/` | 12 |
| SNS topic | An AWS notification list; `dr4w-alerts` emails the owner | 2 |
| SPA | Single-page application: loads once, then updates with API calls | 3 |
| Spec-driven development | Writing and agreeing the spec before writing code | 12 |
| SQS | AWS's message queue service | 8, 15 |
| SSM Parameter Store | AWS Systems Manager's free store for configuration and secrets | 2, 9 |
| State / state lock | OpenTofu's record of what exists / the lock that stops two runs at once | 7 |
| Static assets | Files served as-is: HTML, JavaScript, CSS, images | 5 |
| Status code | The number in an HTTP response, e.g. 200 OK, 403 Forbidden | 4 |
| Tag | A label on a cloud resource, e.g. `project = hello`, used to filter costs | 10 |
| Throttling | Limiting how many requests per second are accepted | 9, 10 |
| Transaction | Several database writes that all happen or none do | 6 |
| Trust policy / assume a role | Who may use a role / to start using it and get its temporary permissions | 9 |
| TTL | Time to live: DynamoDB deletes an item automatically after a time | 6 |
| TypeScript | JavaScript with types | 5 |
| Versioned event | An event name ending in `.v1`, `.v2` so changes don't break consumers | 8 |
| Vitest | The unit-test runner | 4, 13 |
| Worker | A small program on Cloudflare's edge; each project has one | 5 |
| workerd | Cloudflare's Worker runtime, which `pnpm dev` runs on your laptop | 11 |
| wrangler | Cloudflare's command-line tool that deploys Workers; config in `web/wrangler.jsonc` | 4, 11 |
| YAGNI | "You aren't gonna need it": don't build what isn't needed yet (ponytail's rule) | 12 |
| caveman / ponytail | Claude plugins: terse chat replies / minimal code without cutting safety | 12 |
