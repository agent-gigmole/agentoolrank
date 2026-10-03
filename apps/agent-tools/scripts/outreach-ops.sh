#!/usr/bin/env bash
# Nightly maker outreach (systemd user timer agentoolrank-outreach, 22:00 Beijing; unit files in ops/systemd).
# Brevo health gate → up to 10 emails (send-outreach.ts guards: one email per address ever, opt-outs, holds,
# mailing lists, live rank). A blocked gate or a failed send fails the service so agentkit notices.
set -uo pipefail
cd "$(dirname "$0")/.."
export PATH="$HOME/.bun/bin:$PATH"
unset GITHUB_TOKEN
bun run scripts/send-outreach.ts --require-healthy >> "data/ops-logs/outreach-$(date +%F).log" 2>&1
