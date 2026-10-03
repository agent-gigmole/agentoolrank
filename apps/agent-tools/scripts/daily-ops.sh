#!/usr/bin/env bash
# Daily AgentoolRank ops (systemd user timer agentoolrank-daily, unit files in ops/systemd): review up to 3 free submissions (+ all paid), then log the funnel.
set -uo pipefail
cd "$(dirname "$0")/.."
export PATH="$HOME/.bun/bin:$PATH"
unset GITHUB_TOKEN
fail=0  # any failed step makes the systemd service fail, so rule-check / agentkit notice
log="data/ops-logs/$(date +%F).log"
{
  echo "== $(date -Is) review"
  bun run scripts/review-submissions.ts --apply --free=3 || fail=1
  echo "== live emails (the /submit form promises one when the page is live)"
  bun run scripts/send-live-emails.ts || fail=1
  echo "== funnel (7d)"
  bun run scripts/funnel-report.ts 7 || fail=1
  echo "== indexnow"
  bun run scripts/indexnow.ts || fail=1
  python3 scripts/gsc_sitemap.py || fail=1
  echo "== stripe alipay/wechat status (#29)"
  bun run scripts/stripe-pm-status.ts || fail=1
  echo "== brevo health by tag (shared account)"
  bun run scripts/brevo-tag-health.ts || fail=1
  echo "== directory listings (live page + our link rel)"
  bun run scripts/check-listings.ts || fail=1
  echo "== search console (28d)"
  python3 scripts/gsc_report.py 28 || fail=1
} >> "$log" 2>&1
exit $fail
