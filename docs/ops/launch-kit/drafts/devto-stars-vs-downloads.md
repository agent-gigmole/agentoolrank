# Stars measure attention, downloads measure use: 230 AI agent tools

Pydantic recorded 812.6 million package downloads against 28.9 thousand GitHub stars. Dependencies help explain the gap. For Docker-distributed platforms, package counts can miss much of the use. Check both signals, then recent commits and issue response.

The October 3, 2026 snapshot covers 230 open-source agent tools in AgentoolRank with qualifying npm or PyPI packages. Downloads come from the npm downloads API and pypistats for the last 30 days.

## A library and a Docker app count differently

Compare Pydantic with n8n: n8n has 206.5 thousand stars and 384.9 thousand package downloads. Langflow shows a similar contrast, with 155.5 thousand stars and 40.1 thousand package downloads.

That is not evidence that either platform gets little use. n8n and Langflow are mostly installed through Docker or their own installers. An npm or PyPI counter undercounts those installation paths.

Libraries work differently. Other code depends on them, and they get installed in every build. Those installations collect downloads without collecting stars. Pydantic's numbers illustrate how far package retrieval can diverge from GitHub attention.

| Project | Downloads, last 30 days | GitHub stars |
| --- | ---: | ---: |
| Pydantic | 812.6 million | 28.9 thousand |
| OpenAI Python | 284.2 million | 31.7 thousand |
| MCP Python SDK | 219.0 million | 24.5 thousand |
| n8n | 384.9 thousand | 206.5 thousand |
| Langflow | 40.1 thousand | 155.5 thousand |

The installation route is the first thing I would check before interpreting this table. A dependency library and a self-hosted platform can both publish packages, yet package downloads capture different portions of their use.

A tool with many stars and few downloads can still be widely used. Check how it is distributed before reading the gap as hype.

## A compact checklist for choosing a tool

When choosing a library, look at both numbers, plus recent commits and issue response:

- **Confirm the package mapping.** Does the npm or PyPI registry page link back to the tool's own GitHub repository?
- **Check the installation path.** Is the package registry a main route, or do people mostly use Docker or the project's installer?
- **Read both counters with their scope attached.** Here, downloads cover 30 days and include CI and mirrors. They are not a count of users.
- **Inspect recent commits.**
- **Check issue response.** Look at how issues are being answered before making your choice.

Start by establishing what the download number measures. Then use the two counters as context for a closer look at the repository.

For a library, substantial package retrieval is evidence that a star count alone would miss. For a platform distributed mostly outside npm and PyPI, the registry count is a narrower view. Neither observation tells you which tool is better.

## The library gap extends beyond Pydantic

OpenAI Python recorded 284.2 million downloads alongside 31.7 thousand stars. The MCP Python SDK recorded 219.0 million downloads alongside 24.5 thousand stars.

AI SDK adds another example: 108.0 million downloads and 27.1 thousand stars. LangChain, meanwhile, has 169.4 million downloads and 147.4 thousand stars.

Downloads per star make that contrast easy to see. Pydantic has approximately 28,000 downloads per star, compared with approximately 8,955 for OpenAI Python and 8,952 for the MCP Python SDK.

Neither stars nor downloads alone tells you which tool is better. "Downloads per star" is a description of two counters. Calling it "users per star" would be wrong, because downloads include automated retrieval through CI and mirrors.

The dependency explanation also has a limit: it explains why libraries can collect installations without matching attention. Downloads are a usage signal, not a user count. Pydantic's 812.6 million downloads should remain a package-use signal, not become a claim about 812.6 million developers.

## Keep the comparison inside its measurement boundaries

Every package in this count must have a registry page linking back to the tool's own GitHub repository. That rule keeps the package-to-project relationship explicit.

The date matters for a different reason. These are 30-day download totals in an October 3 snapshot, shown alongside GitHub star counts.

There are also differences among the more-starred projects that publish packages. MarkItDown and Firecrawl each have 188.1 thousand stars in the snapshot, with 13.9 million and 4.0 million package downloads respectively.

## What I would do with these numbers

For maintainers, the practical point is to stop asking a star count to account for every installation. A library can enter builds without receiving corresponding GitHub attention. A self-hosted platform can be installed through channels that its package counter does not cover.

I make AgentoolRank, a directory of open-source AI agent tools ranked by live GitHub activity. We also have a [downloads page](https://agentoolrank.com/downloads).

Use these numbers to find the questions worth taking back to a candidate's repository. Check how a tool is distributed before reading the gap between stars and downloads, and look at recent commits and issue response too. Choose with those checks in view, rather than letting either headline counter settle the decision.

The same data is queryable over MCP/API with a [free key](https://agentoolrank.com/api-key).

If a package mapping is wrong, tell us.

Jason T.

Disclosure: I make AgentoolRank; the downloads page is ours.
