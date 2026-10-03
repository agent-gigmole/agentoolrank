# Brief: dev.to article — "Stars measure attention, downloads measure use" (planned 2026-10-12)

## Author / disclosure
Jason T., maker of AgentoolRank (agentoolrank.com), a directory of open-source AI agent tools ranked by live GitHub activity. The /downloads page is ours.

## Audience
Developers choosing agent frameworks, MCP servers and libraries; maintainers who watch their star count.

## Goal
Show, with numbers, that GitHub stars and real usage diverge, and explain why. Readers leave with a better way to judge a tool, and know /downloads exists.

## Facts (only these numbers, taken 2026-10-03 from tool_packages; re-pull on the publish day and replace if they changed)
- 230 open-source agent tools in our directory publish an npm or PyPI package from their own repo.
- Counting method: npm downloads API and pypistats, last 30 days; a package only counts if its registry page links back to the tool's own GitHub repo. Downloads include CI and mirrors: a usage signal, not a user count.
- Top 10 by downloads (30 days, stars in brackets): Pydantic 812.6M (28.9K), OpenAI Python 284.2M (31.7K), MCP Python SDK 219.0M (24.5K), LangChain 169.4M (147.4K), AI SDK 108.0M (27.1K), LiteLLM 89.4M (60.1K), FastMCP 50.1M (28.0K), LangGraph 43.7M (42.7K), Playwright MCP server 29.0M (37.8K), Langfuse 22.4M (35.3K).
- Downloads per GitHub star (≥100K downloads): Pydantic ~28,000; OpenAI Python ~8,955; MCP Python SDK ~8,952; AI SDK ~3,984; FastMCP ~1,793.
- Most-starred tools that publish a package, with downloads: n8n 206.5K stars → 384.9K downloads; MarkItDown 188.1K → 13.9M; Firecrawl 188.1K → 4.0M; Langflow 155.5K → 40.1K.

## What the numbers mean (the article may say these, nothing stronger)
- Libraries other code depends on get installed in every build, so they collect downloads without stars. Apps and platforms people self-host (n8n, Langflow) are mostly installed via Docker or their own installers, so package downloads undercount them. Neither number alone tells you which tool is better.
- A tool with many stars and few downloads can still be widely used; check how it is distributed before reading the gap as hype.
- Practical: when choosing a library, look at both, plus recent commits and issue response.

## Links
- https://agentoolrank.com/downloads (once, in the body)
- https://agentoolrank.com/api-key (one line at the end: the same data is queryable over MCP/API with a free key)

## Rules
- Factual title, under 80 characters, no hype words. No claims about which tool is "best". Don't name any project negatively.
- Short sections, one small table. End with one line inviting corrections ("if a package mapping is wrong, tell us"). Signed: Jason T.
