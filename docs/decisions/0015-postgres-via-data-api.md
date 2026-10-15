# 0015 · Optional Postgres uses the RDS Data API

**Date:** 2026-10-14

## Context
Lambdas in a VPC would need NAT or endpoints, which cost money every hour.

## Decision
The shared Aurora Serverless v2 cluster has the Data API on; `pg-database` creates one database and role per project, with credentials in Secrets Manager.

## Consequences
No VPC, scales to 0 ACU; ~15 s resume after a pause and ~$0.40/month per secret. Not deployed yet. Revisit for heavy relational workloads.

## Status
Accepted (unused).
