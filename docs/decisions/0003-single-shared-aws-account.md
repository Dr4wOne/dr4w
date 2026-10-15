# 0003 · Use the existing shared AWS account

**Date:** 2026-10-14

## Context
A separate member account isolates cost and blast radius but adds setup. The existing account 809411919562 already had IAM Identity Center and other workloads.

## Decision
Run dr4w in account 809411919562. Isolation comes from `dr4w-*` naming, scoped CI policies and the `dr4w-boundary` permissions boundary.

## Consequences
The `dr4w-monthly` budget measures the whole account. Other roles there (e.g. `gha-sandbox`) can affect dr4w's security posture (`docs/STATUS.md`). Revisit if costs get hard to attribute or another workload needs broad access.

## Status
Accepted.
