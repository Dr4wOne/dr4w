# Local development

## Commands
```bash
pnpm dev                  # pick projects interactively
pnpm dev hello echo       # several at once; hello's events reach echo
pnpm dev:cloud hello      # local servers, API against hello's REAL AWS resources
pnpm seed <project>       # (re)create the project's tables in dynamodb-local
```

## What `pnpm dev <p>` starts (`scripts/dev.ts`)
| Piece | Local | Production |
|---|---|---|
| Database | `dynamodb-local` in Docker, host port **8100** (in-memory) | DynamoDB `dr4w-<p>-prod-<key>` |
| Tables | created from `apps/<p>/infra/tables.json` | same file, via OpenTofu |
| API | `tsx watch src/local.ts` (Node, port `ports.api`) | `src/lambda.ts` on Lambda |
| Web + Worker | Vite + `@cloudflare/vite-plugin` (port `ports.web`), real `worker/index.ts` | Cloudflare Worker |
| Origin secret | `dev-origin-secret` in `api/.env.local` and `web/.dev.vars` | SSM + Worker secret |
| Events | POST to running consumers' `/api/_events` | `dr4w-bus` |

Each project's Worker debugger port is `9229 + ports.web − 5173`. Stop with Ctrl-C (it stops
every child process).

## Tests
`pnpm test` (all) or `pnpm --filter <p>-api test`. API tests use a fresh `dr4w-<p>-test-*` table in
dynamodb-local and start the container if needed.

## Common mistakes
- Port 8000 or 9229 already taken by another tool — see `docs/troubleshooting.md`.
- Using `pnpm dev:cloud` to test writes: it writes to **production** data.
