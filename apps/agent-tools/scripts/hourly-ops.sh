#!/usr/bin/env bash
# Hourly AgentoolRank ops (WSL cron): reconcile Stripe payments so a closed tab never loses an order.
set -uo pipefail
cd "$(dirname "$0")/.."
export PATH="$HOME/.bun/bin:$PATH"
unset GITHUB_TOKEN
bun run scripts/reconcile-payments.ts --days=3 >> "data/ops-logs/reconcile-$(date +%F).log" 2>&1
