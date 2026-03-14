#!/usr/bin/env bash
set -euo pipefail

echo "Validating package-lock.json sync with package.json..."

log_file="$(mktemp)"

if npm ci --dry-run --ignore-scripts --no-audit --fund=false --loglevel=error >"$log_file" 2>&1; then
    echo "package-lock.json is in sync with package.json."
    rm -f "$log_file"
    exit 0
fi

echo "::error::package-lock.json is out of sync with package.json. Run npm install locally and commit the updated package-lock.json."
echo "npm ci --dry-run output (last 30 lines):"
tail -n 30 "$log_file" || true
rm -f "$log_file"
exit 1
