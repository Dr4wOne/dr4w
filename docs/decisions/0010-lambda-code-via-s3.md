# 0010 · Lambda code ships through an S3 artifacts bucket

**Date:** 2026-10-15

## Context
The first deploy failed: inline zip uploads hit `bufio.Scanner: token too long` in the AWS provider's request logging.

## Decision
`project-api` uploads the zip to `dr4w-<p>-<env>-artifacts-<account>` (public access blocked, 30-day expiry) and Lambda reads it from there.

## Consequences
One small bucket per project; also works past the 50 MB inline limit.

## Status
Accepted.
