#!/usr/bin/env bash
# pnpm infra:check — `tofu fmt -check` + `tofu validate` for every OpenTofu root stack
# (modules are validated through the stacks that use them).
# Offline: uses -backend=false, so no AWS credentials are needed.
set -euo pipefail
cd "$(dirname "$0")/.."

tofu fmt -check -recursive infra apps

dirs="infra/bootstrap infra/platform $(ls -d apps/*/infra 2>/dev/null | tr '\n' ' ')"
for d in $dirs; do
  printf '%-40s ' "$d"
  tofu -chdir="$d" init -backend=false -input=false >/dev/null
  tofu -chdir="$d" validate -no-color | tail -1
done
