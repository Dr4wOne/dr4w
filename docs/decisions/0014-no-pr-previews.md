# 0014 · No PR preview environments (for now)

**Date:** 2026-10-15

## Context
Previews (a `pr-<n>` stack per PR) add workflows and resources to clean up.

## Decision
Skip them. State keys are already per environment (`projects/<p>/${var.env}/…`), so they can be added later.

## Consequences
Changes are first seen in production after merge, protected by plans and smoke tests. Revisit when several people review UI changes.

## Status
Accepted.
