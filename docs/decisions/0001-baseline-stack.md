# 0001 · Baseline stack (locked in the spec)

**Date:** 2026-10-14

## Context
dr4w needs one cheap, reusable way to take ideas to live products, maintained by one person.

## Decision
Adopt the locked decisions in `docs/SPEC.md` §2: one pnpm + Turborepo monorepo; TypeScript everywhere; Vite + React SPA on Cloudflare Workers with Static Assets; the Worker proxies `/api/*` (same origin); one Hono Lambda per project behind an API Gateway HTTP API (Node 24, arm64, esbuild); DynamoDB on-demand by default; optional shared Aurora Serverless v2 (off); OpenTofu with an S3 backend and native lockfile; SSM Parameter Store for config and secrets; SSM + EventBridge as the cross-project contract; SSO on the laptop, GitHub OIDC in CI; `us-east-1`; Vitest + Playwright.

## Consequences
Idle cost ≈ $0; adding an endpoint is a route, not infra. Downsides: no SSR, no WebSockets, cold starts, AWS + Cloudflare to understand. Revisit if a project needs long-running work, relational-heavy data, or SSR (handbook, “Limits and trade-offs”).

## Status
Accepted. Later ADRs refine it.
