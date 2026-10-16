# 03 · Foundations in one sitting

> **In one sentence:** the minimum about the web, the cloud and shipping code that you need to read the rest of this handbook.
> **Reading time:** ~12 min · **Level:** 🟢 beginner primer — experts skip to chapter 4

## Why this matters
dr4w combines a dozen technologies. You don't need to master them, but you need a picture of what
each one does, in plain words. Every term here is also in the glossary ([Appendix A](appendix-a-glossary.md)).

## The idea, simply

### Part 1 — How the web works
- A **browser** asks for pages; a **server** answers. They talk with **HTTP**, a simple
  request/response language: "GET me this page" → "200 OK, here it is". **HTTPS** is the same,
  encrypted with **TLS**, which needs a **certificate** proving the site is who it claims to be.
- A **domain** like `dr4w.io` is a human name for a server. **DNS** is the internet's phone book that
  turns names into addresses. `hello.dr4w.io` is a **subdomain** of `dr4w.io`.
- A **CDN** (content delivery network) keeps copies of files in many cities, so pages load from
  somewhere close. Its servers are called **the edge**. Cloudflare is a CDN that can also run code.
- The **frontend** is what runs in the browser (buttons, forms). The **backend** runs on servers
  (saving data). They talk through an **API**: a list of URLs like `GET /api/notes` that return
  data, usually as **JSON** (text that looks like `{"title": "hi"}`).
- An **SPA** (single-page application) loads one page once, then updates itself with API calls.

### Part 2 — Cloud and serverless
- **The cloud** means renting computers and services from companies like AWS instead of owning them.
- A **server** you rent runs 24/7 and costs money even when idle. **Serverless** means you upload
  only your code; the provider runs it when a request arrives and bills per use. An idle
  serverless project costs (almost) nothing.
- The catch is the **cold start**: the first request after a quiet period waits while the
  provider starts your code. Later requests reuse the warm copy.
- A **region** is one group of data centers (dr4w uses `us-east-1`, Virginia). The **edge** is
  hundreds of small locations close to users.
- **Pay-per-use** prices are tiny per request; the **free tier** covers a lot of small usage.
- The AWS services dr4w uses: **Lambda** (runs a *function* — your code — per request),
  **API Gateway** (receives web requests and hands them to Lambda), **DynamoDB** (the database),
  **SSM Parameter Store** (settings and secrets) and **EventBridge** (events between projects).
  AWS names everything with an **ARN**, a long unique ID like `arn:aws:lambda:…:function:dr4w-hello-prod-api`.

### Part 3 — From code to production
- **Git** records every change to the code as a **commit**. A **branch** is a parallel line of
  work. **GitHub** hosts the repository.
- A **pull request (PR)** proposes merging a branch into `main`. Others (or robots) review it first.
- **CI/CD** — continuous integration and delivery — means robots test every PR and deploy every
  merge. In dr4w the robots are **GitHub Actions** workflows (`.github/workflows/`).
- An **environment** (like `production`) is a place the code runs; GitHub can protect who may deploy to it.
- **Infrastructure as code (IaC)** describes servers, databases and permissions in text files
  instead of clicking in a web console. A tool (dr4w uses **OpenTofu**) compares the files with
  reality and makes the changes. The files can be reviewed like code.
- A **monorepo** keeps many projects in one repository, so they share tools and libraries.

## How it works in dr4w
| Concept | Where you meet it |
|---|---|
| DNS, subdomain, HTTPS | `hello.dr4w.io`, record and certificate created automatically by Cloudflare (chapter 4, step 2) |
| SPA + API + JSON | `apps/hello/web/src/App.tsx` calls `GET /api/notes` (chapter 4) |
| Serverless, cold start | the Lambda `dr4w-hello-prod-api` (chapter 5) |
| Region vs edge | Worker at the edge, Lambda in `us-east-1` (chapter 2) |
| PR, CI/CD, environment | `ci.yml` on PRs, `deploy.yml` on merge to `main` (chapter 11) |
| IaC | `apps/hello/infra/main.tf` (chapter 7) |
| Monorepo | `apps/`, `packages/` (chapter 2) |

## Try it
```bash
curl -s https://hello.dr4w.io/api/health
```
Expected: `{"ok":true,"project":"hello"}` — a real HTTPS request to an API that returns JSON.

## 🔵 Expert notes
Nothing here is dr4w-specific; experts lose nothing by skipping it. The one dr4w-specific idea
introduced here is that **idle cost matters more than peak performance** — it drives most choices
in chapter 14.

## Common mistakes
- Thinking "serverless" means "no servers". There are servers; you just don't manage or pay for them while idle.
- Thinking IaC replaces the cloud console for reading. You still look in the console to inspect; you change things only through code (`docs/dos-and-donts.md` → Infra).

## Check yourself
1. What does DNS do?
2. Why does an idle serverless project cost almost nothing, and what is the trade-off?
3. What is the difference between a PR and a merge?

<details><summary>Answers</summary>

1. It turns a name like `hello.dr4w.io` into the address of a server.
2. You pay per request, not per hour; the trade-off is the cold start on the first request after idle time.
3. A PR proposes a change and gets checked; merging applies it to `main` (and in dr4w, deploys it).
</details>

## Learn more
MDN — how the web works: https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Web_standards/How_the_web_works ·
AWS — what is serverless: https://aws.amazon.com/serverless/ · GitHub flow: https://docs.github.com/en/get-started/using-github/github-flow ·
next: [04 · The journey of a request](04-request-journey.md)
