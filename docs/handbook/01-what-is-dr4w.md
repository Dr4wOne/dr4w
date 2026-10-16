# 01 · What is dr4w

> **In one sentence:** dr4w is a personal platform that turns a one-line idea into a live web product at `<name>.dr4w.io`, cheaply and repeatably.
> **Reading time:** ~6 min · **Level:** 🟢 beginner-friendly

## Why this matters
Most side projects die between "nice idea" and "something people can use". Each new project
usually means choosing a host, a database, a deploy process and a way to keep secrets — again.
dr4w makes those choices once, so every new idea starts from a working base and costs close to
nothing while nobody is using it.

## The idea, simply
Think of a food court. Every stall cooks something different, but they share the building, the
electricity, the cleaning and the cash system. Opening a new stall means bringing a recipe, not
building a restaurant.

In dr4w, each **project** is a stall: a small web app with its own address (like `hello.dr4w.io`).
The shared building is the **platform**: the same way of hosting pages, running code, storing
data, deploying and watching for problems. A new project reuses all of it.

## How it works in dr4w
Every project has three parts, all inside one folder `apps/<name>/`:

| Part | What it is | Lives in |
|---|---|---|
| Web | The pages people see, built with React | `apps/hello/web/` |
| API | The code that saves and loads data, written with Hono (a small web framework) | `apps/hello/api/` |
| Infra | A description of the cloud resources the project needs | `apps/hello/infra/` |

Two projects are live today:
- **hello** (https://hello.dr4w.io) — create, list and delete notes.
- **echo** (https://echo.dr4w.io) — counts the notes created in `hello`, live. It exists to show
  how one project can react to another.

What you get as a builder:
- `pnpm new <name>` creates a working project in seconds (`docs/guides/new-project.md`).
- `pnpm dev <name>` runs it on your laptop, offline once installed (it uses Docker for a local database).
- Merging a pull request on GitHub puts a project online — no manual clicks. (Shared platform changes are run by hand on purpose; chapter 7.)
- Claude Code (Anthropic's coding assistant) slash commands — typed instructions such as `/idea`, `/spec`, `/plan`, `/poc`, `/launch` — guide an idea from a
  sentence to a live URL. A dry run did it in 12 minutes 39 seconds (`ideas/guestbook/00-idea.md`).

Who it's for: one developer (the owner, Daniel) shipping many small products, plus any future
collaborator or AI session that needs to pick the work up quickly.

**What dr4w is not:**
- not a place for user accounts or login (a deliberate "not yet", `docs/SPEC.md` §1),
- not built for heavy traffic, long-running jobs, live connections (WebSockets) or search-engine
  page rendering — chapter 15 explains each limit and the way out,
- not a multi-team, multi-account enterprise setup.

## Try it
You need Node 24, pnpm 12, Git and Docker (install steps: `docs/setup-new-machine.md`).
```bash
pnpm install
pnpm dev hello
```
Open http://localhost:5173, add a note, delete it. Everything runs on your machine; stop with Ctrl-C.
Expected: a "Notes" page; your note appears at the top of the list.

## 🔵 Expert notes
- **Design goal:** idle cost ≈ $0 per project and < $5/month for the whole platform, with no
  long-lived cloud credentials anywhere (one known exception on the owner's laptop is tracked in `docs/STATUS.md`). Today's estimate is $0.00–0.10/month idle (`docs/costs.md`, not yet measured).
- **Shape:** a pnpm/Turborepo monorepo; React SPA on Cloudflare Workers; one Lambda per project
  behind an API Gateway HTTP API; DynamoDB on-demand; OpenTofu modules; GitHub Actions with OIDC.
  Each choice and its alternatives: chapter 14 and `docs/decisions/`.
- **Spec vs reality:** the code wins. Differences from the original spec (public repo, shared AWS
  account, Lambda code via S3, real Worker in local dev, no PR previews) are tracked in `docs/STATUS.md`.

## Common mistakes
- Treating `apps/hello` as a toy to delete — it is the reference implementation every guide points to.
- Building login first. It is out of scope for v1; see `docs/dos-and-donts.md` for the patterns that are in scope.

## Check yourself
1. What are the three parts of every project?
2. What does `echo` demonstrate?
3. Name two things dr4w is deliberately not good at.

<details><summary>Answers</summary>

1. Web (React pages), API (Hono code), infra (cloud resource description) — all under `apps/<name>/`.
2. How one project reacts to another project's events (it counts `hello`'s new notes).
3. Any two of: user login, heavy traffic, long-running jobs, WebSockets, server-side rendering for SEO, multi-region.
</details>

## Learn more
`README.md` (5-minute tour) · `docs/STATUS.md` (current state) · `docs/SPEC.md` (original requirements) ·
next chapter: [02 · The big picture](02-the-big-picture.md)
