#!/usr/bin/env bash
# Nightly maker outreach (systemd user timer agentoolrank-outreach, 22:00 Beijing; unit files in ops/systemd).
# Brevo health gate → up to 10 emails (send-outreach.ts guards: one email per address ever, opt-outs, holds,
# mailing lists, live rank). A blocked gate or a failed send fails the service so agentkit notices.
set -uo pipefail
cd "$(dirname "$0")/.."
export PATH="$HOME/.bun/bin:$PATH"
unset GITHUB_TOKEN
# Refill the candidate list when fewer than 20 unsent remain (outreach-list.ts overwrites candidates.json, so back it up first;
# sent.json still prevents any repeat). Uses the project's own GitHub token, read-only use of public READMEs.
unsent=$(python3 -c "import json;c=json.load(open('data/outreach/candidates.json'));s={x['email'].lower() for x in json.load(open('data/outreach/sent.json'))};print(sum(1 for x in c if x['email'].lower() not in s))" 2>/dev/null || echo 0)
if [ "$unsent" -lt 20 ]; then
  cp data/outreach/candidates.json "data/outreach/candidates-$(date +%F).json.bak" 2>/dev/null
  GITHUB_TOKEN=$(cat "$HOME/.config/secrets/github-agentoolrank") bun run scripts/outreach-list.ts --per-category=$(( 12 + $(ls data/outreach/candidates-*.json.bak 2>/dev/null | wc -l) * 4 )) >> "data/outreach-$(date +%F)-list.log" 2>&1
fi
bun run scripts/send-outreach.ts --require-healthy >> "data/ops-logs/outreach-$(date +%F).log" 2>&1
