# 0016 · Platform uses subdomains only

**Date:** 2026-10-14

## Context
The `dr4w.io` apex is served by the separate `Dr4wOne/dr4w-landpage` repo.

## Decision
Projects only create `<subdomain>.dr4w.io` Worker custom domains; `www`, `api`, `mail`, `dr4w` are reserved in `pnpm new`.

## Consequences
A “live projects” page on the apex is a separate future idea.

## Status
Accepted.
