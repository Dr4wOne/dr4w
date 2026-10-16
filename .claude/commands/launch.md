---
description: Launch checklist, then open a PR — merging it deploys to <subdomain>.dr4w.io
argument-hint: <slug>
---

Launch `ideas/$ARGUMENTS` (project from its frontmatter).

Checklist — fix anything red before continuing:
- [ ] `pnpm check`, `pnpm check:projects`, `pnpm infra:check` green
- [ ] `apps/<p>/project.json`: subdomain is right and not taken (`echo`/`hello`/… and never the
      apex or `www`); `status: "live"`; `uses`/`exposes` match any cross-project wiring
- [ ] Smoke test covers the core flow (`apps/<p>/web/e2e/smoke.spec.ts`)
- [ ] No secrets in the diff (`git diff main --stat`, scan for tokens/keys); the repo is public
- [ ] `/ponytail-review` on the branch — fix every must-fix finding
- [ ] `/ponytail-debt` — copy open `shortcut:` items into `docs/STATUS.md` → Known issues
- [ ] Idea frontmatter `status: live`, `updated` today

Then:
1. Branch `launch/<slug>`, commit (end the message with the repo's Co-Authored-By line), push
   (`git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push -u origin …`).
2. `gh pr create` with a summary + checklist. Wait for CI (`gh pr checks <n> --watch`) and show
   the plan comment (expect only creates for a new project).
3. **Stop and ask me for "go"** before merging. On go: `gh pr merge <n> --squash --delete-branch`,
   watch the `deploy` run, then verify `https://<subdomain>.dr4w.io` and `/api/health` yourself.
