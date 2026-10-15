# 0011 · One Lambda per project also handles bus events

**Date:** 2026-10-15

## Context
Consumers need to run code on events; a second Lambda per project would double IAM, logs and alarms.

## Decision
`createLambdaHandler(app, events)` in `packages/api-kit/src/events.ts` sends API Gateway events to Hono and EventBridge envelopes to `onEvent` handlers in `src/events.ts`, validated against the contract. Locally the same handlers run behind `/api/_events`.

## Consequences
Shared timeout and memory for API and events. SQS events are not routed yet. Revisit if event work needs different limits.

## Status
Accepted.
