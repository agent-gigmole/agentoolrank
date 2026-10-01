---
title: "Where to list an MCP server or AI agent tool: free vs paid (checked Oct 2026)"
published: false
tags: mcp, ai, opensource, showdev
canonical_url: https://agentoolrank.com/where-to-list
---

<!-- 发布计划：2026-10-03（与 10-01 的数据长文错开，避免同账号同日连发）。canonical 指向 /where-to-list。链接带 ?ref=devto2。 -->

*Disclosure: I build [AgentoolRank](https://agentoolrank.com/?ref=devto2), one of the directories in the table below. Prices and review times were checked on each site's submit page on 2026-10-01; they change, so check the links before you decide. The up-to-date version of this table lives at [agentoolrank.com/where-to-list](https://agentoolrank.com/where-to-list?ref=devto2).*

This week I shipped a public MCP server (`https://agentoolrank.com/api/mcp` — search 669 open-source agent tools, pull GitHub stats and alternatives) and went through the places an MCP or agent-tool builder would reasonably list it. I published to the MCP Registry, submitted to mcpservers.org and PeerPush's free queue, and checked the submit pages of the rest. Here's what each asks for and what's free.

## The short version

- **Almost everything has a free route if you can wait.** Paid tiers mostly buy speed, placement or a dofollow link.
- **For an MCP server, publish to the official MCP Registry first.** It's free, it's immediate, and other directories read from it.
- **mcpservers.org is free** (up to 2 weeks). **mcp.so's web form is paid** ($39); there's a free GitHub-issue route.

## The table

| Directory | Free option | Paid options | Review time |
|---|---|---|---|
| [Official MCP Registry](https://registry.modelcontextprotocol.io) | Yes, via `mcp-publisher` CLI | — | Immediate after domain/GitHub verification |
| [mcpservers.org](https://mcpservers.org/submit) | Yes | $39 (≤24h, badge, dofollow) | Free: up to 2 weeks |
| [mcp.so](https://mcp.so/submit) | Not on the web form (GitHub issue route) | $39 one-time | Paid: instant |
| [PeerPush](https://peerpush.com/submit) | Yes, free queue (we were quoted ~70 days) | $39 · $89 · $229 | Paid: instant |
| [AI Agents List](https://aiagentslist.com/submit) | Eligibility check only | $29 lifetime · $49 launch boost | 48h / 24h |
| [AgentoolRank](https://agentoolrank.com/submit?ref=devto2) (mine) | Yes, queued review | $9 · $19 · $49 | Free: queue order |

## Publishing to the official MCP Registry (the one worth doing first)

This took about 10 minutes. If you own a domain, DNS verification lets you use a `com.yourdomain/...` name instead of `io.github.you/...`:

1. Add a `server.json` describing your server (name, description, version, and a `remotes` entry with your Streamable HTTP URL).
2. Generate an Ed25519 key, put the public key in a TXT record on your domain (`v=MCPv1; k=ed25519; p=...`).
3. `mcp-publisher login dns --domain yourdomain.com --private-key <hex>` then `mcp-publisher publish`.

Two things that tripped me up:
- The login token expires quickly — if `publish` fails with an auth error a while after logging in, just run `login` again.
- The `name` in `server.json` must match the namespace you verified (`com.agentoolrank/...` for `agentoolrank.com`).

## What I'd do again

1. MCP Registry → 2. mcpservers.org (free) → 3. one general directory where builders browse (PeerPush's free queue) → 4. stop, and spend the rest of the time on content people actually search for.

Paying to jump queues only made sense to me if launch timing mattered. For a side project, the free queues were fine.

If you've found another MCP or agent-tool directory that's worth the time, I'd like to hear about it — I'll add it to the [live table](https://agentoolrank.com/where-to-list?ref=devto2) after checking its submit page.
