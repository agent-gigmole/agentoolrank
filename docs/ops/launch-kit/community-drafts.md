# Community post drafts (need owner approval — owner's personal HN / Reddit accounts, or new brand accounts)

All numbers come from https://agentoolrank.com/report (live GitHub data, 2026-10-01). Every post says plainly that the author built AgentoolRank. No vote asking, no cross-posting the same text.

---

## 1. Hacker News — Show HN (owner's HN account)

**Title:** Show HN: AgentoolRank – 669 open-source AI agent tools ranked by GitHub activity, queryable via MCP

**URL:** https://agentoolrank.com

**First comment (author):**

I kept picking agent frameworks by star count and then finding out the repo hadn't had a commit in months. So I built a directory that ranks open-source agent tools (frameworks, coding agents, MCP servers, RAG/memory, evals) by activity instead: 30-day star growth, commits in the last 90 days, releases and issue response time, refreshed daily from the GitHub API.

Some things the data shows right now:
- 32% of the 669 tracked tools have had no commit in 6+ months — including MetaGPT (71k stars), gpt-engineer (55k) and AgentGPT (36k).
- The fastest-growing projects this month add 20k+ stars per 30 days (Skills, LangChain, hermes-agent).

Two parts that might be interesting to HN:
- There's a public MCP server (https://agentoolrank.com/api/mcp, listed in the official MCP Registry) so Claude/Cursor can search tools, pull stats and alternatives directly.
- Submissions are agent-friendly: an agent can POST a tool and gets every listing option back in one response, with a "cheapest option within your budget/deadline" recommendation — no upsell flows.

Every tool also has an alternatives page and side-by-side comparisons. The report page is CC BY 4.0: https://agentoolrank.com/report

Happy to hear what metrics you'd trust more than stars.

---

## 2. Reddit — r/LocalLLaMA or r/AI_Agents (owner's Reddit account; read each sub's self-promo rule first)

**Title:** I tracked 669 open-source AI agent tools: 32% haven't had a commit in 6 months (incl. MetaGPT 71k★, gpt-engineer 55k★)

**Body:**

I built a small directory that ranks open-source agent tools by GitHub activity rather than stars (disclosure: it's my project, agentoolrank.com). Pulling the numbers together surprised me:

- 32% of 669 tools: no commit in 6+ months. Big names in that group: MetaGPT (71k★, last commit Jan 2026), gpt-engineer (55k★, Nov 2024), Quivr (40k★), FastChat (40k★), AgentGPT (36k★).
- Fastest growing right now (stars / 30 days): Skills +26k, LangChain +23k, hermes-agent +21k, DeepSeek Harness +20k.
- MCP-first tools are a real category now: 29 of them with ~580k stars combined.

Full tables (free to reuse, CC BY 4.0): https://agentoolrank.com/report

If you rely on one of the "quiet" projects, each has an alternatives page with maintained options. Curious whether people here weight commits or releases more when choosing a framework.

---

## 3. dev.to article (brand account hello@agentoolrank.com — can be registered by Claude; publishing needs approval)

**Title:** Stars lie: what 669 open-source AI agent repos look like when you rank by activity

**Outline:**
1. Why stars are a lagging signal (with the 32% inactive stat and 3 examples).
2. The four signals we use (30-day star pace, 90-day commits, releases in 6 months, issue response) and how they're computed daily.
3. Top growers and most active projects this month (tables from /report).
4. MCP as a category: how many, how fast they grow.
5. How to query the data from your own agent (MCP config snippet from /agents).
6. Disclosure + link, canonical URL pointing to https://agentoolrank.com/report.
