---
description: Session start — brief me on where the repo stands
---

Get oriented, then brief me. Read only what's needed:

1. `CLAUDE.md` (already loaded) and `docs/STATUS.md`.
2. `git log --oneline -15`, `git status -sb`, and `gh pr list --repo Dr4wOne/dr4w` (open PRs).
3. If a branch other than `main` is checked out, `git diff --stat main...HEAD`.

Reply with a **5-line briefing** (caveman voice is fine — it's chat — but file paths, commands and
branch names stay exact):
1. Where we are (live projects, last merged change).
2. In progress (from STATUS + current branch/PRs).
3. Anything blocking or broken (known issues that matter now, failing CI).
4. Uncommitted or unpushed work, if any.
5. Suggested next step (one concrete action).

Don't change anything.
