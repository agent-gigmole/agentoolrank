import type { Metadata } from "next";
import Link from "next/link";
import { KeyButton } from "./KeyButton";

export const metadata: Metadata = {
  title: "Free API Key for the AgentoolRank MCP Server and API",
  description: "Get a free key for the AgentoolRank MCP server and REST API in one click: no signup, no email. Search agent tools, compare them, and get launch-directory recommendations from your own agent.",
  alternates: { canonical: "/api-key" },
};

export default function ApiKeyPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-10 text-gray-800">
      <h1 className="text-3xl font-bold text-gray-900 mb-3">Free API key</h1>
      <p className="mb-4">
        One click, no signup and no email. The key identifies your agent when it calls our MCP server or API, so we can see which tools
        people actually use. Everything that is free without a key stays free.
      </p>
      <KeyButton />
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Use it</h2>
      <pre className="bg-gray-50 border rounded-lg p-3 text-xs overflow-x-auto mb-4">{`MCP (any client that supports headers):
{ "mcpServers": { "agentoolrank": { "url": "https://agentoolrank.com/api/mcp",
  "headers": { "Authorization": "Bearer ark_…" } } } }

Tools: search_tools, get_tool, get_alternatives, submit_tool,
       get_submission_status, recommend_directories`}</pre>
      <p className="text-sm text-gray-600">
        We store only a hash of the key, never the key itself, and no IP address. Lost it? Create another.
        More on the MCP server: <Link href="/agents" className="underline">/agents</Link>.
      </p>
    </main>
  );
}
