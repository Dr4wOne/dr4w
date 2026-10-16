# 0009 · Lambda reserved concurrency off by default

**Date:** 2026-10-14

## Context
AWS rejects reservations that leave fewer than 100 unreserved executions; the account's quota was 10.

## Decision
`reserved_concurrency` in `project-api` defaults to `null`; API Gateway throttling (50 rps / burst 100) is the always-on cost cap. Quota increase to 1000 requested.

## Consequences
No per-project concurrency cap until the quota rises. Revisit when the quota is ≥ 1000: set 10 per project.

## Update 2026-10-15
AWS approved the quota increase to 1000. Every project stack now sets `reserved_concurrency = 10`
(`apps/*/infra/main.tf`, and the template for new projects); the module default stays `null`.

## Status
Accepted — the temporary part is resolved (see Update).
