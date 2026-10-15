# Create a new project

**Goal:** a new app at `apps/<name>/` that runs locally and can be deployed.

## Steps
```bash
pnpm new <name>                    # optional: --subdomain <sub>; runs pnpm install
pnpm dev <name>                    # web http://localhost:<ports.web>, api :<ports.api>
pnpm --filter "./apps/<name>/**" test
```
`scripts/new-project.ts` copies `templates/project/`, fills the name/subdomain/ports, and creates
`api/.env.local` and `web/.dev.vars` (both git-ignored). Names: lowercase, ≤ 20 chars; subdomains
`www`, `dr4w`, `api`, `mail` are reserved.

What you get: `project.json` (manifest, schema in `scripts/lib/projects.ts`), `README.md`,
`CLAUDE.md`, a Hono API with `GET /api/health`, a React page, the proxy Worker, infra
(`project-api` + `dynamo-table`), and a Playwright smoke test.

## Real example
`apps/echo/` was created with `pnpm new echo` and then extended (`docs/guides/connect-projects.md`).

## Verify
`curl -s localhost:<ports.web>/api/health` → `{"ok":true,"project":"<name>"}` while `pnpm dev <name>` runs.

## Next
Endpoints: `docs/guides/new-endpoint.md`. Infra: `docs/guides/new-resource.md`. Go live: `docs/guides/deploy.md`.

## Common mistakes
- Hand-copying another project instead of `pnpm new` — ports and names collide.
- Choosing a subdomain that already has a CNAME in Cloudflare: the custom domain step fails.
