// Builds /llms.txt (https://llmstxt.org): a Markdown index that lets AI assistants
// find and cite AgentoolRank pages without crawling the whole site.

export interface LlmsTxtInput {
  baseUrl: string;
  toolCount: number;
  refreshedAt: string | null;
  categories: Array<{ slug: string; name: string; toolCount: number }>;
  topTools: Array<{ id: string; name: string; tagline: string; stars: number | null }>;
  comparisons: Array<{ slugA: string; slugB: string; nameA: string; nameB: string }>;
}

function toolLine(baseUrl: string, t: LlmsTxtInput["topTools"][number]): string {
  const details = [t.tagline.trim(), t.stars != null ? `(${t.stars.toLocaleString("en-US")} GitHub stars)` : ""]
    .filter(Boolean)
    .join(" ");
  return `- [${t.name}](${baseUrl}/tool/${t.id})${details ? `: ${details}` : ""}`;
}

export function buildLlmsTxt(input: LlmsTxtInput): string {
  const { baseUrl } = input;
  const lines = [
    "# AgentoolRank",
    "",
    `> AgentoolRank ranks ${input.toolCount} open-source AI agent tools by real GitHub activity (stars, star growth, commits, releases, issue response time) and compares them side by side.`,
    "",
    `Data is refreshed from the GitHub API${input.refreshedAt ? `; last refresh: ${input.refreshedAt}` : ""}. Every tool page lists capabilities, integrations, limitations, best-for / not-for, and pricing.`,
    "",
    "## Categories",
    ...input.categories.map((c) => `- [${c.name}](${baseUrl}/category/${c.slug}): ${c.toolCount} tools`),
    "",
    "## Top tools",
    ...input.topTools.map((t) => toolLine(baseUrl, t)),
    "",
    "## Comparisons",
    ...input.comparisons.map((p) => `- [${p.nameA} vs ${p.nameB}](${baseUrl}/compare/${p.slugA}-vs-${p.slugB})`),
    "",
    "## For AI agents: list a tool",
    `- MCP server: ${baseUrl}/api/mcp (Streamable HTTP). Tools: search_tools, get_tool, get_alternatives, submit_tool, get_submission_status.`,
    `- Or POST ${baseUrl}/api/v1/submissions with JSON {url, name, tagline, email, github_url?, max_budget_usd?, deadline_days?, want_featured?}.`,
    "- The response lists every option up front: free (queued), $9 priority (live within 3 days), $19 fast (1 day), $49 featured (1 day + 7 days on the homepage). Each paid option has a checkout_url for your human to pay; recommended_plan is the cheapest option within your budget and deadline. No upsells later.",
    "- Keep submission_id and status_token; GET status_url to see when the listing is live.",
    "",
    "## Optional",
    `- [State of open-source AI agent tools](${baseUrl}/report): monthly data report — fastest-growing, most active and inactive tools, category growth (CC BY 4.0)`,
    `- [New tools](${baseUrl}/new): recently added tools`,
    `- [Weekly report](${baseUrl}/weekly): fastest-growing tools this week`,
    `- [Stacks](${baseUrl}/blueprint): tool combinations for common builds (RAG chatbot, code review agent, ...)`,
    `- [Submit a tool](${baseUrl}/submit): free listing for AI agent tools`,
    `- [JSON API](${baseUrl}/api/v1/tools?q=rag): public read-only API, e.g. /api/v1/tools?q=...&limit=20 and /api/v1/tools/{slug}`,
    `- [MCP server](${baseUrl}/api/mcp): Streamable HTTP MCP endpoint with tools search_tools, get_tool, get_alternatives`,
    `- [Sitemap](${baseUrl}/sitemap.xml)`,
    "",
  ];
  return lines.join("\n");
}
