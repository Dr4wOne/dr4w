# 0006 · Mount each route file explicitly in `app.ts`

**Date:** 2026-10-14

## Context
Auto-registering route files from the filesystem would save one line but loses Hono's inferred app type.

## Decision
Each resource is one `.route('/<resource>', <resource>)` line in `api/src/app.ts`; `/endpoint` adds it.

## Consequences
End-to-end typed web client (`hc<AppType>`). Cost: one extra line per resource.

## Status
Accepted.
