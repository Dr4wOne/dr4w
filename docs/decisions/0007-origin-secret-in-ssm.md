# 0007 · Origin secret in SSM, cached and refreshed on mismatch

**Date:** 2026-10-14

## Context
The Lambda must verify that requests come from its Worker. A secret in Lambda env vars is visible to read-only principals.

## Decision
`random_password` → SSM SecureString `/dr4w/<p>/prod/origin_secret`; the Lambda reads it once per container and, on a mismatch, re-reads it at most once a minute (added 2026-10-15 for rotation). The Worker gets it as a secret via `wrangler deploy --secrets-file`.

## Consequences
The secret is also in OpenTofu state (encrypted bucket). Rejected requests still invoke Lambda (throttling caps cost). Revisit if Cloudflare-to-AWS mTLS or private connectivity becomes simple.

## Status
Accepted.
