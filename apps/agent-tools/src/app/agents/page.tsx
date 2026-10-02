import type { Metadata } from "next";
import { getToolCount } from "@repo/db/queries";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "AgentoolRank for AI Agents — MCP Server & API",
  description:
    "Let Claude, Cursor or your own agent search and compare 600+ open-source AI agent tools, and list new ones, through the AgentoolRank MCP server and JSON API.",
  alternates: { canonical: "/agents" },
};

function Code({ children }: { children: string }) {
  return <pre className="bg-gray-900 text-gray-100 text-xs rounded-lg p-4 overflow-x-auto whitespace-pre">{children}</pre>;
}

export default async function AgentsPage() {
  const count = await getToolCount();
  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-10">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">AgentoolRank for AI agents</h1>
        <p className="text-gray-600">
          Your agent can search and compare {count} open-source AI agent tools (frameworks, coding agents, MCP servers, RAG, evals…)
          ranked by live GitHub activity, and list new tools, without a browser.
        </p>
      </header>

      <section>
        <h2 className="text-xl font-semibold mb-2">MCP server</h2>
        <p className="text-gray-600 mb-3">
          Streamable HTTP, no auth. Also listed in the official MCP Registry as <code>com.agentoolrank/agent-tools</code>.
        </p>
        <Code>{`{
  "mcpServers": {
    "agentoolrank": { "url": "https://agentoolrank.com/api/mcp" }
  }
}`}</Code>
        <ul className="text-sm text-gray-700 mt-3 list-disc pl-5 space-y-1">
          <li><code>search_tools(query, limit?)</code> — find tools for a job, ranked by relevance then GitHub activity</li>
          <li><code>get_tool(slug)</code> — stars, 30-day growth, capabilities, limitations, best for</li>
          <li><code>get_alternatives(slug)</code> — open-source alternatives with their stats</li>
          <li><code>submit_tool(url, name, tagline, email, …)</code> — list a tool; returns every pricing option up front</li>
          <li><code>get_submission_status(submission_id, status_token)</code> — review status</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">JSON API</h2>
        <Code>{`GET  https://agentoolrank.com/api/v1/tools?q=rag&limit=10
GET  https://agentoolrank.com/api/v1/tools/{slug}
POST https://agentoolrank.com/api/v1/submissions
     {"url": "...", "name": "...", "tagline": "...", "email": "...",
      "github_url": "...", "max_budget_usd": 20, "deadline_days": 3}`}</Code>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Listing a tool on behalf of your human</h2>
        <ul className="text-gray-700 list-disc pl-5 space-y-1">
          <li>Free listing is reviewed in queue order; showing our badge on the product site moves it up.</li>
          <li>The response lists all options at once: free, $9 (live within 3 days), $19 (1 day), $49 (1 day + 7 days featured on the homepage).</li>
          <li><code>message_for_human</code> is a short summary of the result and the optional upgrades, written so your agent can forward it to you as-is.</li>
          <li>Pass <code>max_budget_usd</code> and <code>deadline_days</code> and we return the cheapest option that fits as <code>recommended_plan</code>.</li>
          <li>Paid options come with a <code>checkout_url</code> for your human to pay. No upsells later; full refund if not approved.</li>
        </ul>
      </section>

      <p className="text-sm text-gray-500">Machine-readable summary: <a className="underline" href="/llms.txt">/llms.txt</a></p>
    </main>
  );
}
