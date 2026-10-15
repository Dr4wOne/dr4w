#!/usr/bin/env bash
# pnpm infra:check — `tofu fmt -check` + `tofu validate` for every OpenTofu root/module.
# Offline: uses -backend=false, so no AWS credentials are needed.
set -euo pipefail
cd "$(dirname "$0")/.."

tofu fmt -check -recursive infra apps

dirs=$(find infra apps -name '*.tf' -not -path '*/.terraform/*' -printf '%h\n' | sort -u)
for d in $dirs; do
  printf '%-40s ' "$d"
  tofu -chdir="$d" init -backend=false -input=false -lockfile=readonly >/dev/null
  tofu -chdir="$d" validate -no-color | tail -1
done
