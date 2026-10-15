# guestbook — spec

**Goal:** a public page where anyone leaves a one-line message (name + text) and sees the latest 20.

**Out of scope:** login, moderation UI, editing/deleting entries, pagination, rate limiting beyond
API Gateway's default throttle, rich text, notifications.

## User stories
1. *As a visitor I can leave a message.*
   - Given the page, when I submit name (1–40 chars) and message (1–280 chars), then it appears at the top of the list.
   - Given an empty or too-long field, when I submit, then I get a validation error (400) and nothing is saved.
2. *As a visitor I see recent messages.*
   - Given entries exist, when I open the page, then I see the latest 20, newest first, with name and relative time.

## Endpoints (behind the origin secret)
| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/entries` | — | `200 { items: Entry[] }` (≤ 20, newest first) |
| POST | `/api/entries` | `{ name: string(1..40), message: string(1..280) }` | `201 Entry` · `400` validation |

`Entry = { id: uuid, name, message, createdAt: ISO datetime }`

## Data model (DynamoDB, table `main`)
| pk | sk | attrs |
|---|---|---|
| `ENTRY` | `<createdAt>#<id>` | id, name, message, createdAt |

Latest 20 = `Query pk = ENTRY, ScanIndexForward = false, Limit = 20` (sk sorts by time). No GSI.

## Events
None.

## Infra (catalog)
`project-api`, `dynamo-table` (from the template). Nothing else.

## UI
- One page: form (Name, Message, *Sign*), then the list of entries.
