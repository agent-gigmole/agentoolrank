#!/usr/bin/env bash
# Weekly AgentoolRank ops (WSL cron, Monday 10:00 Beijing): draft the weekly X post → Telegram for approval.
set -uo pipefail
cd "$(dirname "$0")/.."
export PATH="$HOME/.bun/bin:$HOME/.local/bin:$PATH"
unset GITHUB_TOKEN
bun run scripts/weekly-post.ts --send >> "data/ops-logs/weekly-$(date +%F).log" 2>&1
