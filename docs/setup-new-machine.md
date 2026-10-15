# Set up a new machine

From a blank Linux/macOS laptop (Windows: WSL2) to `pnpm dev` working and able to ship.
Takes ~20 minutes. One-time **account** setup (AWS, Cloudflare, GitHub) is a different doc:
`docs/bootstrap.md` — you don't need it on a second machine.

## 1. Install tools
Versions to match: `docs/stack.md`.
```bash
# Node 24 via nvm (https://github.com/nvm-sh/nvm), then pnpm 12
nvm install 24 && corepack enable && corepack prepare pnpm@12.11.2 --activate

# Docker: https://docs.docker.com/engine/install/ (or Docker Desktop on macOS)
# GitHub CLI: https://cli.github.com
gh auth login

# OpenTofu 1.13.1 (Linux amd64; other platforms: https://opentofu.org/docs/intro/install/)
V=1.13.1; cd /tmp && curl -sSLO https://github.com/opentofu/opentofu/releases/download/v$V/tofu_${V}_linux_amd64.zip \
  && unzip -o tofu_${V}_linux_amd64.zip tofu && install -m 0755 tofu ~/.local/bin/tofu && cd -

# AWS CLI v2, per-user (Linux x86_64; macOS: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
curl -sSLo /tmp/awscliv2.zip https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip \
  && unzip -qo /tmp/awscliv2.zip -d /tmp && /tmp/aws/install -i ~/.local/aws-cli -b ~/.local/bin --update
```
Make sure `~/.local/bin` is on your `PATH`.

## 2. Get the code and run it
```bash
gh repo clone Dr4wOne/dr4w && cd dr4w
pnpm install
pnpm dev hello                     # http://localhost:5173 — create a note
pnpm check                         # lint + typecheck + test + build
```
No cloud access is needed for any of this.

## 3. AWS access (to read prod, run plans, use `pnpm dev:cloud`)
Add to `~/.aws/config` (or run `aws configure sso` and check it created **`dr4w`** — it may
overwrite a similar profile, see `docs/troubleshooting.md`):
```ini
[sso-session dr4w]
sso_start_url = https://d-9066602024.awsapps.com/start
sso_region = us-east-1
sso_registration_scopes = sso:account:access

[profile dr4w]
sso_session = dr4w
sso_account_id = 809411919562
sso_role_name = HumanAdmin
region = us-east-1
output = json
```
```bash
aws sso login --profile dr4w
aws sts get-caller-identity --profile dr4w     # …assumed-role/AWSReservedSSO_HumanAdmin_…
```
Never create IAM access keys.

## 4. Cloudflare (optional)
Deploys run in CI with the token stored in GitHub, so the laptop needs no Cloudflare login.
For manual inspection only: `cd apps/hello/web && pnpm exec wrangler login`.

## 5. Verify
```bash
pnpm run doctor
```
Every line should be ✅ (Cloudflare login is optional). Next: `docs/guides/local-dev.md`.
