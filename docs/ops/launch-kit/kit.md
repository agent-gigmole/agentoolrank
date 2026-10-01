# AgentoolRank launch kit

- **Name:** AgentoolRank
- **Tagline (≤60):** Open-source AI agent tools, ranked by GitHub activity
- **Bio (short):** Ranking 460+ open-source AI agent tools by real GitHub activity. agentoolrank.com
- **Website:** https://agentoolrank.com
- **Signup email:** hello@agentoolrank.com (Cloudflare Email Routing → 0xzap0x@gmail.com, readable via gmail_secondary MCP)
- **Logo:** logo-512.png (site icon style, blue gradient "AT")
- **Screenshots (1280×800):** shot-home.png, shot-alternatives.png, shot-tool.png, shot-compare.png

## Description
AgentoolRank ranks 460+ open-source AI agent tools by real GitHub activity: stars, 30-day star growth, commits, releases and issue response time, refreshed daily.

Every tool gets a profile with capabilities, integrations, limitations and who it's best for, plus an "alternatives" page and side-by-side "X vs Y" comparisons, so you can pick a framework, coding agent, memory layer or eval tool without opening 20 GitHub tabs.

Makers can submit their agent tools for free and get a badge with live star counts. The whole index is also available to AI assistants via llms.txt.

## Accounts (credentials in ~/.config/secrets/accounts/agentoolrank-*.json, 600)
| Platform | Status |
|---|---|
| dev.to | ✅ https://dev.to/agentoolrank — brand account hello@agentoolrank.com (creds agentoolrank-devto.json), reCAPTCHA checkbox passed without image challenge (2026-10-01). Publishing the data article needs owner approval (queued via agentkit) |
| PeerPush | ✅ hello@agentoolrank.com (email code login), user @hello2502 (rename pending), product https://peerpush.com/p/agentoolrank — free queue #4190, ~70 days (joined 2026-10-01; declined 40% off upsell) |
| Peerlist | ✅ https://peerlist.io/agentoolrank — personal profile "Ethan Tan" (owner-approved real name), project AgentoolRank (AI, DevTool) added 2026-10-01; Launchpad weekly launch not yet used |
| X | ✅ signed in on the dedicated Chrome (password login; email-code route goes to tensam.th@gmail.com which Claude can't read). It is the owner's personal build-in-public account **Zephyr @hwak8666621** (verified, ~23 followers) → profile NOT rebranded; use for build-in-public posts about AgentoolRank; every public post needs owner OK (external identity gate) |
| Product Hunt | ⏸ owner's personal maker account @ethan_tan11 (owner says: Google login tensam.th@gmail.com); pixtidy launches on it 10/3 → don't touch profile, don't use for AgentoolRank before 10/10 |

## MCP / agent registries
| Registry | Status |
|---|---|
| PulseMCP | ✗ submissions paused site-wide (2026-10-01) |
| mcp.so | ⏸ only $39 paid auto-submit or a support ticket; not paid (spend-control) |
| AI Agents List | ⏸ account hello@agentoolrank.com (creds agentoolrank-aiagentslist.json), eligibility PASSED, draft saved; only paid tiers $29/$49 → not paid (zero-revenue rule) |
| mcpservers.org | ✅ free submission 2026-10-01 (Search category, remote https://agentoolrank.com/api/mcp, no auth, registry name com.agentoolrank/agent-tools); review ≤2 weeks, email to hello@ on approval |
| mcp.so (free route) | ⏸ GitHub issue on chatmcp/mcpso "Add MCP server: …" — needs a GitHub account with issue rights (our token is repo-scoped); listing outcome unverified |
| Official MCP Registry (registry.modelcontextprotocol.io) | ✅ com.agentoolrank/agent-tools v1.0.0, remote streamable-http https://agentoolrank.com/api/mcp — DNS auth (TXT v=MCPv1 on agentoolrank.com; private key ~/.config/secrets/mcp-registry-agentoolrank.pem). v1.0.1 websiteUrl → /agents. Re-publish: bump version in apps/agent-tools/mcp/server.json, `mcp-publisher login dns …` (registry JWT expires quickly — log in right before publishing) then `mcp-publisher publish` |

## Email sending
| Service | Status |
|---|---|
| Resend | ✗ signup blocked by Cloudflare Turnstile under CDP-controlled Chrome (2026-10-01) |
| Brevo | ✅ account hello@agentoolrank.com (free 300/day, Ethan Tan / TENSO LLC address), credentials ~/.config/secrets/accounts/agentoolrank-brevo.json; sending blocked until phone verification. 10-01 03:33 tried Twilio +19047347766 once: Brevo said code sent, nothing received in 300s (Twilio shows Messaging disabled / no A2P). Not retried; waiting for agentkit test or SIM line ② |
