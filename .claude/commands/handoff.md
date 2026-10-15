---
description: Session end — save what matters into the repo (STATUS, ADRs, docs) and commit
---

Make the repo remember this session. The repo is the memory (`CLAUDE.md`).

1. Review the session: `git log --oneline main..HEAD`, `git diff --stat`, and what we discussed.
2. Update `docs/STATUS.md`: "Last updated" (date + `git rev-parse --short HEAD`), Live projects,
   In progress, Next up, Known issues (new problems, gaps, shortcuts left in code), Recent decisions.
3. Decision made this session? Add `docs/decisions/NNNN-<slug>.md` (next number; Context ·
   Decision · Consequences · Status), add it to `docs/decisions/README.md` and to the top of
   STATUS → Recent decisions (keep 10).
4. A problem solved that could recur? Add a row to `docs/troubleshooting.md`.
5. Run `/doc-check` logic on the session's changes (docs made stale → fix them).
6. `pnpm docs:check`, then commit only the doc changes as `docs: session handoff` on the current
   branch (never on `main` directly; open a PR if the branch is `main`'s copy). Show the summary.
