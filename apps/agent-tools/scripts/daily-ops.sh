#!/usr/bin/env bash
# Daily AgentoolRank ops (WSL cron): review up to 3 free submissions (+ all paid), then log the funnel.
set -uo pipefail
cd "$(dirname "$0")/.."
export PATH="$HOME/.bun/bin:$PATH"
unset GITHUB_TOKEN
log="data/ops-logs/$(date +%F).log"
{
  echo "== $(date -Is) review"
  bun run scripts/review-submissions.ts --apply --free=3
  echo "== funnel (7d)"
  bun run scripts/funnel-report.ts 7
  echo "== indexnow"
  bun run scripts/indexnow.ts
  echo "== stripe alipay/wechat status (#29)"
  bun run scripts/stripe-pm-status.ts
  echo "== brevo health by tag (shared account)"
  bun run scripts/brevo-tag-health.ts
  echo "== search console (28d)"
  python3 scripts/gsc_report.py 28
} >> "$log" 2>&1
