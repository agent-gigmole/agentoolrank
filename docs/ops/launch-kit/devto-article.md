---
title: "Stars lie: 669 open-source AI agent repos ranked by what they actually do"
published: false
tags: ai, opensource, github, agents
canonical_url: https://agentoolrank.com/report
cover_image: https://agentoolrank.com/api/og?title=Stars%20lie
---

*Disclosure: I build [AgentoolRank](https://agentoolrank.com), the directory these numbers come from. The data is refreshed daily from the GitHub API and the full tables are free to reuse (CC BY 4.0).*

I kept picking AI agent frameworks the way most of us do: sort by stars, skim the README, `pip install`. Then, weeks later, I'd find the repo hadn't merged anything in months.

So I started tracking 669 open-source tools for building, running and evaluating AI agents — frameworks, coding agents, MCP servers, RAG and memory layers, eval tools — and ranking them by **activity** instead of stars. Here's what that looks like.

## 1. A third of the ecosystem has gone quiet

**213 of 669 tools (32%) have had no commit on their default branch in six months or more.** That includes **68 projects with 5,000+ stars**:

| Project | Stars | Last commit |
|---|---|---|
| MetaGPT | 70.7k | Jan 2026 |
| gpt-engineer | 55.1k | Nov 2024 |
| Grok-1 | 52.2k | Mar 2024 |
| Quivr | 39.6k | Jun 2025 |
| FastChat | 39.6k | Jun 2025 |
| Langchain-Chatchat | 38.7k | Nov 2025 |
| AgentGPT | 36.3k | Apr 2025 |

Stars are a record of past attention. They say very little about whether issues get answered or whether the thing works with this month's model APIs.

## 2. The fastest growers add 20k+ stars a month

Star pace over our daily snapshots, scaled to 30 days:

| Project | Stars | +30 days |
|---|---|---|
| Skills | 179k | +26.3k |
| LangChain | 147k | +23.5k |
| ECC | 270k | +22.5k |
| hermes-agent | 250k | +20.9k |
| DeepSeek Harness | 241k | +20.1k |
| MarkItDown | 188k | +15.3k |
| Firecrawl | 187k | +14.1k |

## 3. Some repos commit hundreds of times a day

Commits on the default branch in the last 90 days (I double-checked the top ones against the GitHub REST API):

- hermes-agent — **32,240**
- OpenHuman — 21,133
- elizaOS — 19,953
- DeepSeek Harness — 19,798
- LiteLLM — 13,153

That's 150–360 commits a day. A good chunk of that is almost certainly agents committing to their own repos — which is its own interesting signal about where this ecosystem is heading.

## 4. Where the growth is, by category

| Category | Tools | Stars added / 30 days |
|---|---|---|
| Agent frameworks | 329 | +380k |
| Tool integration & infrastructure | 128 | +165k |
| Memory & knowledge | 127 | +150k |
| Coding agents | 42 | +92k |
| Enterprise agent platforms | 57 | +75k |
| Observability & evaluation | 70 | +68k |

MCP-first tools are now a category of their own: 29 projects, about 580k stars combined.

## 5. How the ranking works

Four signals, refreshed daily from the GitHub API:

1. **Star pace** — stars gained per 30 days, from daily snapshots (not the lifetime total).
2. **Commits in the last 90 days** on the default branch.
3. **Releases in the last 6 months.**
4. **Issue response** — median time to close recent issues.

They're combined into a percentile score. None of them is perfect on its own (commit counts reward bots; stars reward launch hype), which is why the site shows all four side by side, plus an alternatives page and head-to-head comparisons for every tool.

## 6. Query it from your own agent

If you use Claude, Cursor or any MCP client, you can point it at the data directly:

```json
{
  "mcpServers": {
    "agentoolrank": { "url": "https://agentoolrank.com/api/mcp" }
  }
}
```

Tools: `search_tools`, `get_tool`, `get_alternatives` — and `submit_tool` if you want to list something you've built. There's also a plain JSON API; details at [agentoolrank.com/agents](https://agentoolrank.com/agents).

---

The full, daily-updated tables are at **[agentoolrank.com/report](https://agentoolrank.com/report)**. What would you weight more heavily than stars when picking a framework — release cadence, issue response, something else?
