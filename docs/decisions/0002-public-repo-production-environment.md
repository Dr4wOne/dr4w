# 0002 · Public repo; deploys gated by the `production` environment

**Date:** 2026-10-14

## Context
The org `Dr4wOne` is on GitHub Free. Environments and branch protection exist there only for public repos; the spec wanted the deploy role trusted only for `environment:production`.

## Decision
Make `Dr4wOne/dr4w` public. `dr4w-ci-deploy` trusts only the `production` environment, which deploys only from `main` and has no required reviewers (auto-deploy on merge). `main` is protected (`check` + `plan`). Fork PRs need approval and get no OIDC token.

## Consequences
Everything in the repo, including `ideas/`, is public, so secrets must never be committed (secret scanning + push protection are on). Revisit if the org moves to a paid plan or ideas must stay private.

## Status
Accepted (replaces the spec's private repo).
