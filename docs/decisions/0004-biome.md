# 0004 · Biome for lint and format

**Date:** 2026-10-14

## Context
ESLint + Prettier means several packages and configs to keep compatible.

## Decision
Use Biome (`biome.json`) for both.

## Consequences
One tool, fast. Fewer rules than the ESLint ecosystem. Revisit if a needed rule only exists for ESLint.

## Status
Accepted.
