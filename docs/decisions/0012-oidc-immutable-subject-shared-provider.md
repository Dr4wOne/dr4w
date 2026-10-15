# 0012 · Immutable OIDC subjects; reference the shared OIDC provider

**Date:** 2026-10-14

## Context
The repo sends GitHub's immutable subject claims, and the account already had a GitHub OIDC provider used by other roles.

## Decision
Trust policies use `repo:Dr4wOne@279559492/dr4w@1420042428:…`. Bootstrap only reads the existing provider (data source), never manages it.

## Consequences
A recreated repo with the same name gets no access; destroying bootstrap can't break other pipelines.

## Status
Accepted.
