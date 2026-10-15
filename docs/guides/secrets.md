# Secrets: where they live and how to rotate them

The full inventory of credentials and secrets is in `docs/security.md`. This guide is the "how".

## Add a secret for a project's API
1. Store it in SSM as a SecureString under the project prefix:
   ```bash
   AWS_PROFILE=dr4w aws ssm put-parameter --type SecureString \
     --name /dr4w/<project>/prod/<key> --value '<value>'
   ```
2. Give the Lambda read access to exactly that parameter (an `iam_statements` entry passed to
   `module "api"` in `apps/<project>/infra/main.tf`) and pass the parameter **name** as an env var.
3. Read it at runtime and cache it, like `originSecretFromEnv` in
   `packages/api-kit/src/origin-secret.ts`. Locally, put a dev value in `apps/<project>/api/.env.local`.

Never put secret values in `wrangler.jsonc` `vars`, in committed `.env*` files, or in Lambda env vars.

## Rotate a project's origin secret
The Worker ↔ Lambda shared secret is in SSM `/dr4w/<p>/prod/origin_secret` and in the Worker
secret `ORIGIN_SECRET`.
```bash
cd apps/<p>/infra
pnpm --filter <p>-api build
AWS_PROFILE=dr4w tofu init -backend-config=../../../infra/backend.hcl
AWS_PROFILE=dr4w tofu apply -replace=module.api.random_password.origin_secret   # new value in SSM
gh workflow run deploy.yml -f project=<p>                                         # pushes it to the Worker
```
Between the two steps (about 2–3 minutes) `/api/*` returns 403. Warm Lambdas pick up the new value
by themselves: on a mismatch they re-read SSM, at most once a minute.

## Rotate the Cloudflare API token
1. Cloudflare → *My Profile* → *API Tokens* → **Roll** the `dr4w-ci` token (same permissions as
   `docs/bootstrap.md` §3), or create a new one and delete the old one.
2. `gh secret set CLOUDFLARE_API_TOKEN --env production --repo Dr4wOne/dr4w` (paste the token).
3. Update local copies, if any (e.g. `~/workspace/*/.env`).
4. Verify: `gh workflow run deploy.yml -f project=hello` succeeds.

## Common mistakes
- Rotating the origin secret in SSM without running the deploy — the Worker keeps sending the old one.
- Printing a secret in a workflow log. Mask it (`::add-mask::`), as `deploy.yml` does.
