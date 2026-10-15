---
description: Capture a rough idea as ideas/<slug>/00-idea.md (status idea)
argument-hint: <one-liner>
---

Capture this idea: **$ARGUMENTS**

1. Pick a short kebab-case `slug` (2–3 words, unique under `ideas/`). Suggest a project name
   (lowercase, ≤ 20 chars, `^[a-z][a-z0-9-]*$`) or an existing project from `apps/*/project.json`
   if this is a feature for it.
2. Create `ideas/<slug>/00-idea.md` from `ideas/_template/00-idea.md`: fill every section from the
   one-liner with your best, concrete guesses (mark guesses with "(guess)"). Keep it under 40 lines.
   Frontmatter: `status: idea`, today's date in `created` and `updated`.
3. Don't ask questions here — that's `/refine`. Don't write code.
4. Show the file, then `pnpm ideas`, and suggest the next step: `/refine <slug>` (or `/spec <slug>`
   if the idea is already crisp).
