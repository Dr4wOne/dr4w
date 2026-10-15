# Bootstrap — one-time manual setup

Everything after this is automated (`git push` → deploy). Do the steps in order; each ends with
a ✓ check. Nothing here creates access keys. Expect ~45 minutes.

| # | Step | Who |
|---|---|---|
| 0 | Local tools | you |
| 1 | AWS account: root MFA, IAM Identity Center, SSO profile `dr4w` | you |
| 2 | Lambda concurrency quota | you |
| 3 | Cloudflare API token | you |
| 4 | GitHub repo, environment, secrets | you |
| 5 | Run `infra/bootstrap`, migrate its state | you |
| 6 | Run `infra/platform` | Claude, after your "go" |
| 7 | Confirm the SNS email | you |

---

## 0. Local tools

```bash
node -v        # v24.x
pnpm -v        # 12.x
docker -v
tofu version   # OpenTofu v1.13.1  (installed in ~/.local/bin; pinned in .opentofu-version)
aws --version  # must be ≥ 2.9 for `aws configure sso` with sso-session
```

aws-cli 2.38.1 is installed per-user in `~/.local/aws-cli` (shadows the old 2.7.31 in
`/usr/local`, since `~/.local/bin` is first on PATH). To update later:

```bash
curl -sSLo /tmp/awscliv2.zip https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip
unzip -qo /tmp/awscliv2.zip -d /tmp && /tmp/aws/install -i ~/.local/aws-cli -b ~/.local/bin --update
```

## 1. AWS account

Use one AWS account dedicated to dr4w (the platform assumes it owns every `dr4w-*` name in it).

1. **Root user:** sign in as root → *Security credentials* → assign an **MFA device**. Delete any
   root access keys. Store the root password + MFA recovery somewhere offline; don't use root again.
2. **IAM Identity Center** (console, region **us-east-1**) → *Enable*.
   - *Users* → *Add user* (your name, `dr4wone@gmail.com`), accept the invite, set password + MFA.
   - *Permission sets* → *Create* → *Predefined* → **AdministratorAccess**, session duration 8 h.
   - *AWS accounts* → select the account → *Assign users or groups* → you → the permission set.
   - Copy the **AWS access portal URL** (Dashboard, looks like `https://d-xxxxxxxxxx.awsapps.com/start`).
3. **SSO profile on the laptop:**
   ```bash
   aws configure sso
   #   SSO session name:      dr4w
   #   SSO start URL:         <access portal URL>
   #   SSO region:            us-east-1
   #   SSO registration scopes: sso:account:access   (default)
   #   → browser login → pick the account + AdministratorAccess
   #   CLI default client Region: us-east-1
   #   CLI default output format: json
   #   CLI profile name:      dr4w
   ```
   ✓ `aws sts get-caller-identity --profile dr4w` shows an `AWSReservedSSO_AdministratorAccess_…` ARN.
   Later sessions: `aws sso login --profile dr4w`.

## 2. Lambda concurrency quota

Each project Lambda gets reserved concurrency 10 **only if** the account has room (AWS keeps 100
unreserved). New accounts sometimes start at 10 total.

```bash
aws service-quotas get-service-quota --profile dr4w --region us-east-1 \
  --service-code lambda --quota-code L-B99A9384 --query Quota.Value
```

- **1000** → nothing to do. After M3 we can set `reserved_concurrency = 10` in the module.
- **10** → request 1000 (free, usually approved within a day):
  ```bash
  aws service-quotas request-service-quota-increase --profile dr4w --region us-east-1 \
    --service-code lambda --quota-code L-B99A9384 --desired-value 1000
  ```
  Not blocking: API Gateway throttling (50 rps / burst 100) is always on.

## 3. Cloudflare API token

1. Dashboard → `dr4w.io` → confirm the zone is **Active**. Copy the **Account ID** (right sidebar).
2. Check that no **CNAME** exists for the subdomains we'll use (`hello`, `echo`): Workers Custom
   Domains can't be created on a hostname that already has a CNAME.
3. *My Profile* → *API Tokens* → *Create Token* → *Create Custom Token*, name `dr4w-ci`:

   | Scope | Permission | Access |
   |---|---|---|
   | Account | Workers Scripts | Edit |
   | Account | Account Settings | Read |
   | Zone | Workers Routes | Edit |
   | Zone | DNS | Edit |
   | Zone | Zone | Read |

   - *Account Resources*: Include → your account only.
   - *Zone Resources*: Include → Specific zone → `dr4w.io`.
   - Optional: *Client IP filtering* none (GitHub runners have changing IPs); TTL none.
4. Copy the token once (it isn't shown again). ✓ Test:
   ```bash
   curl -s -H "Authorization: Bearer <token>" \
     https://api.cloudflare.com/client/v4/user/tokens/verify | grep -o '"status":"active"'
   ```

Zone Read is needed by wrangler to resolve `dr4w.io` when creating the custom domain.

## 4. GitHub (public repo `Dr4wOne/dr4w`)

```bash
cd ~/dr4w
gh repo create Dr4wOne/dr4w --public --source . --remote origin --push
```

Then in the repo **Settings**:

1. *Environments* → *New environment* `production`:
   - *Deployment branches and tags* → **Selected branches** → add `main`.
   - No required reviewers (auto-deploy on merge).
   - *Environment secrets*: `CLOUDFLARE_API_TOKEN` (step 3), `CLOUDFLARE_ACCOUNT_ID` (step 3).
2. *Actions → General*:
   - *Fork pull request workflows from outside collaborators* → **Require approval for all external contributors**.
   - *Workflow permissions* → **Read repository contents** (default token read-only).
3. *Code security*: enable **Dependabot alerts** and **secret scanning / push protection**.
4. Branch protection for `main` (requires CI to exist; we add it in M3, task 3.4).

Or with gh, for the environment + secrets:
```bash
gh api -X PUT repos/Dr4wOne/dr4w/environments/production \
  -F 'deployment_branch_policy[protected_branches]=false' \
  -F 'deployment_branch_policy[custom_branch_policies]=true'
gh api -X POST repos/Dr4wOne/dr4w/environments/production/deployment-branch-policies -f name=main
gh secret set CLOUDFLARE_API_TOKEN  --env production --repo Dr4wOne/dr4w   # paste when prompted
gh secret set CLOUDFLARE_ACCOUNT_ID --env production --repo Dr4wOne/dr4w
```
✓ `gh secret list --env production --repo Dr4wOne/dr4w` shows both names.

## 5. Run `infra/bootstrap`

Creates: state bucket `dr4w-tfstate-<account_id>`, GitHub OIDC provider, `dr4w-boundary`,
`dr4w-ci-plan`, `dr4w-ci-deploy` (+ its two policies). Review the plan before typing `yes`.

> If the account already has a GitHub OIDC provider (`token.actions.githubusercontent.com`),
> import it first: `tofu import aws_iam_openid_connect_provider.github <its ARN>`.

```bash
aws sso login --profile dr4w
export AWS_PROFILE=dr4w
cd ~/dr4w/infra/bootstrap
tofu init
tofu plan      # expect ~17 resources to add, 0 to change/destroy
tofu apply

# Shared backend settings for every stack, then move this stack's state into the bucket:
tofu output -raw backend_hcl > ../backend.hcl
mv backend.tf.after-bootstrap backend.tf
tofu init -migrate-state -backend-config=../backend.hcl   # answer "yes"
rm -f terraform.tfstate terraform.tfstate.backup           # now safely in S3
tofu plan                                                   # ✓ "No changes."

cd ~/dr4w
git add infra/backend.hcl infra/bootstrap
git commit -m "Bootstrap: shared backend config"
git push
```

`infra/backend.hcl` contains the bucket name (with the account ID). That's fine to publish —
account IDs aren't secrets — but it's the only place the ID appears.

## 6. Run `infra/platform` (Claude, after your "go")

```bash
export AWS_PROFILE=dr4w
cd ~/dr4w/infra/platform
tofu init -backend-config=../backend.hcl
tofu plan    # bus + archive, SNS topic + email subscription, budget, 3 SSM params
tofu apply
```
Future changes to the platform run from GitHub (`platform.yml`, manual dispatch) — from M3 on.

## 7. Confirm alerts

- Click **Confirm subscription** in the AWS email to `dr4wone@gmail.com`.
  ✓ `aws sns list-subscriptions-by-topic --profile dr4w --topic-arn $(cd infra/platform && tofu output -raw alerts_topic_arn)` shows a real SubscriptionArn (not `PendingConfirmation`).
- ✓ Billing console → *Budgets* shows `dr4w-monthly` ($10).

## What exists afterwards (and what it costs idle)

| Resource | Idle cost |
|---|---|
| S3 state bucket (a few KB, versioned) | ~$0 |
| IAM roles/policies, OIDC provider | $0 |
| EventBridge bus + archive (no events) | $0 |
| SNS topic + email | $0 |
| AWS Budget (first 2 budgets free) | $0 |
| SSM Standard parameters | $0 |
| *(only if `enable_shared_postgres = true`)* Aurora storage + master secret | ~$1–3 / month |
