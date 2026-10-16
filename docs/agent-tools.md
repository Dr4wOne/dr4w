# Agent tools: caveman and ponytail

Two Claude Code plugins are enabled for every session in this repo. Last checked: **2026-10-15**
(caveman v4.0.1, ponytail v5.2.0). Our house rules for them live in `CLAUDE.md` → "Caveman + ponytail".

## What they do
- **caveman** (https://github.com/JuliusBrussee/caveman) — shorter chat replies; code, commands,
  paths and error messages stay exact.
- **ponytail** (https://github.com/DietrichGebert/ponytail) — writes only the code a task needs
  (YAGNI, reuse first) without cutting validation, error handling, security or accessibility.
  Default level here: **full**.

## How they're enabled here
The committed project settings file `.claude/settings.json` declares both marketplaces, **pinned
to release tags**, enables both plugins and sets `PONYTAIL_DEFAULT_MODE=full`. Claude Code applies
it after you trust the folder; you're then offered the plugins. Nothing installs without that
prompt. Decision and trade-offs: `docs/decisions/0017-caveman-and-ponytail-by-default.md`.

## Install manually (if the prompt was skipped) — inside Claude Code
```
/plugin marketplace add JuliusBrussee/caveman
/plugin install caveman@caveman
/plugin marketplace add DietrichGebert/ponytail
/plugin install ponytail@ponytail
```
For use outside this repo, the same commands install them for your user.
Uninstall: `/plugin uninstall caveman@caveman` (or `ponytail@ponytail`), then
`/plugin marketplace remove caveman`. Check: `pnpm run doctor` (✅ for both).

## Commands we use
| Command | When |
|---|---|
| `/caveman status` · `/caveman off` | See or stop the voice for this session |
| `/caveman-commit` | Short commit subject lines (bodies stay plain English) |
| `/ponytail` · `/ponytail off` · `/ponytail lite\|full\|ultra` | See or change the level for this session |
| `/ponytail-review` | Before merging a branch — fix must-fix findings |
| `/ponytail-debt` | Before every `/launch` — copy open `shortcut:` items into `docs/STATUS.md` |
| `/ponytail-audit` | Monthly or before a big feature — results into `docs/STATUS.md` |

## Privacy
- **The plugins** run Node.js hooks locally on session start, subagent start and each prompt
  (caveman also on session end). We reviewed them on 2026-10-15: no network calls; they write mode
  and stats files under `~/.claude/` (or `$CLAUDE_CONFIG_DIR`), and ponytail runs `git ls-files`
  to map the repo.
- **The caveman CLI** (`npx @caveman-ai/cli`) is **not** used here: it sends usage telemetry by
  default, and its optional "Auto" routing sends prompts and attached files (such as `CLAUDE.md`)
  to Caveman Cloud. This repo holds infra and secrets context, so it stays off.

### Optional: the caveman CLI (opt-in only)
If you ever install it, run both of these first: `caveman telemetry off` and `caveman off routing`.

## Updating
Plugins only change when the pinned tag changes. To update: read the new release notes and the
changed hook files (the hooks folder in the ponytail repo, src/hooks in the caveman repo), then change `ref` in
`.claude/settings.json` in a PR, and update the versions at the top of this file.

## Troubleshooting
| Symptom | Fix |
|---|---|
| Plugins not loading | Trust the folder; run the manual install above; then `/reload-plugins` or restart Claude Code |
| `pnpm run doctor` says "not installed" | Same as above; the check reads `claude plugin list --json` |
| Mode stuck (e.g. still terse in docs) | `/caveman off` or `/ponytail full`; docs must follow `docs/conventions.md` → Docs regardless |
| Plugin update overwrote something | Plugins live in Claude Code's plugin cache; pin back to the previous tag |
