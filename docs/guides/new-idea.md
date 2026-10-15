# Take an idea from one line to live

**Goal:** turn a rough idea into a deployed project with Claude slash commands. Each command's
exact steps are in `.claude/commands/<name>.md`; the stages are in `ideas/README.md`.

## Steps
```
/idea a tiny guestbook for my site     → ideas/<slug>/00-idea.md          (status: idea)
/refine <slug>                          → ≤ 7 questions, keep or drop      (optional)
/spec <slug>                            → ideas/<slug>/01-spec.md         (status: specified)
/plan <slug>                            → ideas/<slug>/02-tasks.md        (status: planned)
/poc <slug>                             → pnpm new + code + tests          (status: poc)
/launch <slug>                          → checklist + PR; merge deploys    (status: live)
```
`pnpm ideas` prints the board at any time.

## Real example
`ideas/guestbook/` — the 2026-10-15 dry run: idea → verified live in 12 min 39 s, then destroyed.

## Verify
`pnpm ideas` shows the idea with the expected status; after launch,
`curl -s https://<subdomain>.dr4w.io/api/health` returns `{"ok":true,…}`.

## Common mistakes
- Skipping `/spec` and going straight to code: `/spec` is what limits infra to the module catalog.
- Asking for auth/login — it's a v1 non-goal (`docs/SPEC.md` §1).
