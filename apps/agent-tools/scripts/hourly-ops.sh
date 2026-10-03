#!/usr/bin/env bash
# Hourly AgentoolRank ops (systemd user timer agentoolrank-hourly, unit files in ops/systemd): reconcile Stripe payments so a closed tab never loses an order,
# then refresh the daily KPI block on the ops dashboard.
set -uo pipefail
cd "$(dirname "$0")/.."
export PATH="$HOME/.bun/bin:$PATH"
unset GITHUB_TOKEN
fail=0  # any failed step makes the systemd service fail, so rule-check / agentkit notice
bun run scripts/reconcile-payments.ts --days=3 >> "data/ops-logs/reconcile-$(date +%F).log" 2>&1 || fail=1
bun run scripts/scoreboard.ts >> "data/ops-logs/reconcile-$(date +%F).log" 2>&1 || fail=1  # ops/scoreboard.json for agentkit ranking
bun run scripts/kpi.ts >> "data/ops-logs/kpi-$(date +%F).log" 2>&1 || fail=1
bun run scripts/feedback.ts collect >> "data/ops-logs/kpi-$(date +%F).log" 2>&1 || fail=1  # dev.to comments + GitHub issues → ~/data/feedback
bun run scripts/weekly-post.ts --post --if-pending >> "data/ops-logs/weekly-$(date +%F).log" 2>&1 || fail=1  # X post the post-gate deferred
bun run scripts/devto-publish.ts >> "data/ops-logs/devto-$(date +%F).log" 2>&1 || fail=1  # scheduled dev.to articles (ops/devto-schedule.json)
exit $fail
