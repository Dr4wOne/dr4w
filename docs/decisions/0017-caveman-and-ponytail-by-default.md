# 0017 · Caveman and ponytail plugins on by default

**Date:** 2026-10-15

## Context
Chat replies were long, and generated code tends to grow beyond what a task needs. Two popular
Claude Code plugins address this: caveman (terse replies) and ponytail (minimal code, never cutting
safety). The repo is public and its sessions hold AWS admin SSO credentials, so anything that runs
automatically must be reviewed and stable.

## Decision
Enable both, project-wide, through the committed project settings file (`.claude/settings.json`),
with each marketplace **pinned to a reviewed release tag** (caveman `v4.0.1`, ponytail `v5.2.0`)
and ponytail at `full`. Use only the caveman **plugin**, never its CLI (telemetry and cloud routing).
House rules in `CLAUDE.md` keep docs in plain English and keep validation, auth, IAM, tests and
accessibility out of ponytail's reach.

## Consequences
Shorter replies and leaner code in every session; collaborators are prompted to install the
plugins after trusting the folder. Their hooks run on every prompt (reviewed: no network). Tags
can be moved by their owners, so updates are reviewed PRs, not automatic. Revisit if either
plugin adds network access, if replies get too terse to follow, or if Claude Code supports
pinning a marketplace to a commit SHA (then pin by SHA).

## Status
Accepted.
