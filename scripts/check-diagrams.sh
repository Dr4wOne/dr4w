#!/usr/bin/env bash
# pnpm docs:diagrams — render every ```mermaid block in docs/ with the pinned mermaid-cli.
# Not in CI (it downloads a headless browser); run it when diagrams change (/doc-check does).
set -euo pipefail
cd "$(dirname "$0")/.."
out=$(mktemp -d)
trap 'rm -rf "${out:?}"' EXIT
echo '{"args":["--no-sandbox"]}' > "$out/puppeteer.json"
status=0
for f in $(grep -rl '^```mermaid' docs); do
  n=$(grep -c '^```mermaid' "$f")
  if log=$(npx -y @mermaid-js/mermaid-cli@12.0.0 -p "$out/puppeteer.json" -i "$f" -o "$out/$(basename "$f")" 2>&1); then
    echo "✅ $f ($n)"
  else
    echo "❌ $f"; echo "$log" | grep -E 'Error|Parse error|line [0-9]+' | head -5; status=1
  fi
done
exit $status
