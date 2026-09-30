#!/usr/bin/env bash
# Weekly AgentoolRank ops (WSL cron, Monday 10:00 Beijing): post the weekly leaderboard to X (standing approval 2026-10-01).
set -uo pipefail
cd "$(dirname "$0")/.."
export PATH="$HOME/.bun/bin:$HOME/.local/bin:$PATH"
unset GITHUB_TOKEN
bun run scripts/weekly-post.ts --post >> "data/ops-logs/weekly-$(date +%F).log" 2>&1
