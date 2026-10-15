# 0013 · Tear down Workers via the Cloudflare API

**Date:** 2026-10-15

## Context
`wrangler delete` also lists KV namespaces, which the least-privilege CI token can't read.

## Decision
`destroy.yml` removes the Worker's custom domains and the Worker with direct API calls, accepting “not found” so re-runs work.

## Consequences
No extra token permissions. Revisit if wrangler stops needing KV access.

## Status
Accepted.
