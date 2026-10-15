# 0008 · Cross-project access is granted by the provider (`exposes`)

**Date:** 2026-10-14

## Context
Projects must be able to use each other without hidden coupling or broad IAM.

## Decision
`project.json` `exposes` lists grants per consumer (`events`, `table:read`, `table:write`, `bucket:read`, `queue:send`). `pnpm check:projects` (CI) and plan-time preconditions in `event-subscription` and `project-ref` enforce them.

## Consequences
A missing grant fails at plan time, not at runtime. Revisit if grants need more resources than the closed list.

## Status
Accepted.
