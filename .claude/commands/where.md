---
description: Where is X? — answer with file paths only
argument-hint: <topic>
---

Where is: **$ARGUMENTS**

Look it up in `docs/README.md` and `docs/repo-map.md` first; only if they don't answer it, search
the repo (`git ls-files | grep -i …`, `grep -rn`). Reply with **file paths only** (with a line
number when it's a specific definition), at most 5, most relevant first, each with ≤ 8 words of
context. If nothing matches, say so and suggest the closest doc.
