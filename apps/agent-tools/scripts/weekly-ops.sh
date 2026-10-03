#!/usr/bin/env bash
# Weekly AgentoolRank ops (systemd user timer agentoolrank-weekly, Monday 10:00 Beijing; unit files in ops/systemd): post the weekly leaderboard to X (standing approval 2026-10-01).
set -uo pipefail
cd "$(dirname "$0")/.."
export PATH="$HOME/.bun/bin:$HOME/.local/bin:$PATH"
unset GITHUB_TOKEN
fail=0  # any failed step makes the systemd service fail, so rule-check / agentkit notice
bun run scripts/weekly-post.ts --post >> "data/ops-logs/weekly-$(date +%F).log" 2>&1 || fail=1
bun run scripts/weekly-newsletter.ts --send >> "data/ops-logs/weekly-$(date +%F).log" 2>&1 || fail=1
bun run scripts/fetch-downloads.ts >> "data/ops-logs/weekly-$(date +%F).log" 2>&1 || fail=1  # npm/PyPI monthly downloads → tool_packages
exit $fail
