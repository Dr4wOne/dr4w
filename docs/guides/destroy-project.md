# Destroy a project

**Goal:** remove a project's cloud resources and code for good. Real example: the `guestbook`
dry run was removed this way on 2026-10-15 (`ideas/guestbook/00-idea.md`).

## Steps
1. **Remove links first.** No other project may list it in `uses`; drop it from other
   projects' `exposes`. Merge that change. `destroy.yml` refuses to run otherwise.
2. GitHub → Actions → **destroy** → *Run workflow*: `project = <name>`, `confirm = <name>`
   (or `gh workflow run destroy.yml -f project=<name> -f confirm=<name>`). It:
   - removes the Worker's custom domain and the Worker (Cloudflare API),
   - lifts DynamoDB deletion protection (`protect_data=false`, tables only),
   - runs `tofu destroy` for the whole stack (Lambda, API, tables, SSM, alarms, artifacts bucket).
3. Open a PR that deletes `apps/<name>/` (and its schema in `packages/contracts/src/<name>.ts`),
   and set the idea's `status: dropped`. Merging deploys nothing new.
4. Optional: delete `s3://dr4w-tfstate-809411919562/projects/<name>/prod/terraform.tfstate`.

## Verify
```bash
dig +short <subdomain>.dr4w.io                                        # empty
AWS_PROFILE=dr4w aws lambda list-functions --query "Functions[?starts_with(FunctionName,'dr4w-<name>')]"   # []
```

## Common mistakes
- Deleting `apps/<name>/` before running `destroy.yml` — the workflow needs the project's infra code.
- Running `wrangler delete` locally or in CI: it also lists KV namespaces, which the CI token
  can't read (`docs/troubleshooting.md`). The workflow uses the Cloudflare API instead.
