# Appendix B · Cheat sheet

## Daily commands
```bash
pnpm dev hello            # run a project offline (web :5173, api :8787)
pnpm dev hello echo       # several projects, events delivered locally
pnpm dev:cloud hello      # local servers, REAL prod table (careful with writes)
pnpm new <name>           # scaffold apps/<name>/
pnpm check                # everything CI checks, except infra
pnpm infra:check          # tofu fmt + validate, offline
pnpm docs:check           # links and paths in docs
pnpm run doctor           # tools, SSO, plugins
pnpm ideas                # idea board
aws sso login --profile dr4w
```

## Ship
```bash
git checkout -b feat/<what>
pnpm format && pnpm check
git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push -u origin feat/<what>
gh pr create --fill && gh pr checks --watch
gh pr merge --squash --delete-branch       # = deploy
```

## Claude
`/start` · `/handoff` · `/where <topic>` · `/doc-check` · `/idea` → `/refine` → `/spec` → `/plan` → `/poc` → `/launch` ·
`/endpoint <p> <METHOD /path>` · `/resource <p> <kind>` · `/ponytail-review` · `/ponytail-debt` · `/caveman off`

## Where things live
| What | Where |
|---|---|
| A project | `apps/<p>/` (`project.json`, `api/`, `web/`, `infra/`) |
| Routes / data / events | `apps/<p>/api/src/routes/`, `src/data/`, `src/events.ts` |
| Proxy Worker | `apps/<p>/web/worker/index.ts`, config `web/wrangler.jsonc` |
| Table keys | `apps/<p>/infra/tables.json` |
| Shared schemas and events | `packages/contracts/src/` |
| Infra modules | `infra/modules/` (catalog: `infra/modules/README.md`) |
| Workflows | `.github/workflows/` |
| Current state | `docs/STATUS.md` |

## Names
AWS: `dr4w-<project>-prod-<thing>` · SSM: `/dr4w/<project>/prod/<key>` · events: `dr4w.<project>` + `<Entity>.<Event>.v1`

## URLs
https://hello.dr4w.io · https://echo.dr4w.io · https://github.com/Dr4wOne/dr4w ·
AWS access portal: https://d-9066602024.awsapps.com/start
