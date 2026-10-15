# 0005 · Run the real Worker locally with `@cloudflare/vite-plugin`

**Date:** 2026-10-14

## Context
The spec said Vite proxies `/api` to the local API, which would leave the Worker's proxy code untested locally.

## Decision
Use `@cloudflare/vite-plugin`: `pnpm dev` runs `web/worker/index.ts` in workerd, which proxies to the local API with the dev origin secret. Its build output is what `wrangler deploy` ships.

## Consequences
Local mirrors production more closely; each project needs its own Worker debugger port. Revisit if the plugin lags behind wrangler.

## Status
Accepted (refines the spec).
