# Connecting projects

Two ways for one project to use another. Prefer **events** (loose coupling); use **project-ref**
when you need another project's config or (explicitly granted) direct access to its resources.

Working example in this repo: **hello** publishes `Note.Created.v1`; **echo** counts them.

## 1. Declare the relationship (both sides)

```jsonc
// apps/hello/project.json  (provider)
"exposes": { "echo": ["events"] }

// apps/echo/project.json   (consumer)
"uses": ["hello"]
```

Grants a provider can give: `events`, `table:read`, `table:write`, `bucket:read`, `queue:send`.
`pnpm check:projects` (also in CI) fails if a `uses` has no matching `exposes`, and the
OpenTofu modules below fail at **plan** time if the grant is missing.

## 2. Async: events on `dr4w-bus` (preferred)

**Contract** — `packages/contracts/src/events/<provider>.ts`:
```ts
export const NoteCreatedV1 = defineEvent({
  source: 'dr4w.hello',            // always dr4w.<provider>
  detailType: 'Note.Created.v1',   // <Entity>.<Event>.v<N>
  detail: Note.pick({ id: true, title: true, createdAt: true }),
})
```
Breaking change ⇒ add `…v2`, publish both until every consumer moved, then drop v1.

**Provider** — publish after the write succeeds, and let its Lambda put events:
```ts
await publish(NoteCreatedV1, { id, title, createdAt })   // apps/hello/api/src/routes/notes.ts
```
```hcl
module "api" { … publishes_events = true }               # apps/hello/infra/main.tf
```

**Consumer** — handle it in `src/events.ts` (the project's single Lambda dispatches by
`source` + `detail-type`; the detail is validated against the contract first):
```ts
export const events: EventRoute[] = [
  onEvent(NoteCreatedV1, async (note, meta) => {
    await recordNoteCreated(meta.id, note.title, note.createdAt)
  }),
]
```
…and subscribe in infra:
```hcl
module "from_hello" {
  source           = "../../../infra/modules/event-subscription"
  project          = local.project.name
  env              = var.env
  provider_project = "hello"
  detail_types     = ["Note.Created.v1"]
  function_arn     = module.api.function_arn
  function_name    = module.api.function_name
}
```

Delivery is **at-least-once** with retries (up to 1 h). Make handlers idempotent — echo stores
the event id in the same DynamoDB transaction as the counter update
(`apps/echo/api/src/data/counter.ts`). A handler that throws is retried; an event that fails
validation throws too, so it's never silently half-processed.

**Locally**, `pnpm dev hello echo` wires it for you: hello's `publish()` POSTs the same envelope
to echo's dev-only `/api/_events` route (only for consumers that are running *and* granted
`events`). Test: create a note on http://localhost:5173 → the count on http://localhost:5174 goes up.

Debugging in AWS: the bus archive (`dr4w-bus-archive`, 7 days) keeps every event; replay from
the EventBridge console if a consumer was broken.

## 3. Sync: read another project's outputs (`project-ref`)

Every project writes its outputs to SSM `/dr4w/<project>/<env>/*` (`api_url`, `table_main_name`, …).

```hcl
module "hello" {
  source           = "../../../infra/modules/project-ref"
  provider_project = "hello"
  consumer         = local.project.name
  env              = var.env
}

# config:  module.hello.outputs["api_url"]
# access:  pass module.hello.iam_statements to module.api's iam_statements
```

`iam_statements` contains **only** what the provider granted (e.g. `table:read` →
`dynamodb:GetItem/Query/…` on its table). SecureString parameters (secrets) are never returned.
Calling another project's HTTP API directly isn't supported (its origin secret is private) —
use events, or a granted resource.

## Checklist for a new connection

- [ ] provider `exposes` + consumer `uses` (`pnpm check:projects` passes)
- [ ] event schema in `packages/contracts/src/events/` (versioned)
- [ ] provider: `publish()` + `publishes_events = true`
- [ ] consumer: `onEvent()` in `src/events.ts` (idempotent) + `event-subscription` block
- [ ] test locally with `pnpm dev <provider> <consumer>`
- [ ] merge: providers deploy before consumers (CI sorts by `uses`)
