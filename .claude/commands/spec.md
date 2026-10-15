---
description: Write ideas/<slug>/01-spec.md (stories, criteria, endpoints, data, infra from the catalog)
argument-hint: <slug>
---

Write the spec for `ideas/$ARGUMENTS/` from its `00-idea.md`.

Read first: `CLAUDE.md`, `infra/modules/README.md` (the **only** infra you may use),
`docs/guides/connect-projects.md` if it touches another project, and the target project's
`project.json` + `api/src/app.ts` if it's a feature for an existing project.

Create `ideas/$ARGUMENTS/01-spec.md` with:
- **Goal** (1–2 sentences) and **Out of scope** (bullets — be aggressive; POC first).
- **User stories** with **acceptance criteria** (Given/When/Then, each testable).
- **Endpoints**: `METHOD /api/...` → request/response shape (zod-style), status codes.
  Every endpoint sits behind the origin secret; only `GET /api/health` is public.
- **Data model**: DynamoDB single-table items (pk/sk patterns, GSIs only if needed) — or `pg`
  only if relational queries are essential (it costs ~$1–3/month; say why).
- **Events**: published/consumed (`<Entity>.<Event>.v1`), if any.
- **Infra**: list of catalog modules (e.g. `dynamo-table`, `cron`) — nothing else.
- **UI**: the one or two screens, as bullet lists.

No auth/login (non-goal v1). Keep it to ~1 page. Set `status: specified`, update `updated`.
Show a short summary and suggest `/plan $ARGUMENTS`.
