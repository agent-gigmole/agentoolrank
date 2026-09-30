// Minimal stateless MCP server (Streamable HTTP, JSON responses) so AI assistants
// such as Claude and Cursor can query AgentoolRank directly. Served at /api/mcp.
import type { PublicTool } from "./public-api";

export interface McpDeps {
  search: (query: string, limit: number) => Promise<PublicTool[]>;
  get: (slug: string) => Promise<PublicTool | null>;
  getMany: (slugs: string[]) => Promise<PublicTool[]>;
}

type JsonRpcRequest = { jsonrpc: "2.0"; id?: string | number | null; method: string; params?: Record<string, unknown> };
type JsonRpcResponse = { jsonrpc: "2.0"; id: string | number | null; result?: unknown; error?: { code: number; message: string } };

const SUPPORTED_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];

const TOOLS = [
  {
    name: "search_tools",
    description: "Search open-source AI agent tools (frameworks, coding agents, memory, RAG, observability, MCP servers...) ranked by GitHub activity. Returns stars, 30-day star growth, capabilities and alternatives.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "What you need, e.g. 'multi-agent framework in TypeScript' or 'RAG'" },
        limit: { type: "number", description: "Max results (1-20, default 10)" },
      },
      required: ["query"],
    },
  },
  {
    name: "get_tool",
    description: "Get details for one tool by slug (from search_tools): GitHub stats, capabilities, best-for, limitations, alternatives.",
    inputSchema: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] },
  },
  {
    name: "get_alternatives",
    description: "List open-source alternatives to a tool, with GitHub stats for each, to compare options.",
    inputSchema: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] },
  },
];

function text(data: unknown, isError = false) {
  return { content: [{ type: "text", text: typeof data === "string" ? data : JSON.stringify(data, null, 2) }], isError };
}

async function callTool(name: string, args: Record<string, unknown>, deps: McpDeps) {
  const slug = typeof args.slug === "string" ? args.slug.trim().toLowerCase() : "";
  switch (name) {
    case "search_tools": {
      const query = typeof args.query === "string" ? args.query.trim().slice(0, 100) : "";
      if (!query) return text("query is required", true);
      const limit = Math.min(Math.max(Number(args.limit) || 10, 1), 20);
      return text(await deps.search(query, limit));
    }
    case "get_tool": {
      const tool = await deps.get(slug);
      return tool ? text(tool) : text(`No tool with slug "${slug}". Use search_tools first.`, true);
    }
    case "get_alternatives": {
      const tool = await deps.get(slug);
      if (!tool) return text(`No tool with slug "${slug}". Use search_tools first.`, true);
      return text({ tool: tool.slug, alternatives: await deps.getMany(tool.alternatives) });
    }
    default:
      return text(`Unknown tool: ${name}`, true);
  }
}

export async function handleMcp(msg: JsonRpcRequest, deps: McpDeps): Promise<JsonRpcResponse | null> {
  const id = msg.id ?? null;
  if (msg.id === undefined) return null; // notification: no response
  switch (msg.method) {
    case "initialize": {
      const requested = String(msg.params?.protocolVersion ?? "");
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: SUPPORTED_VERSIONS.includes(requested) ? requested : SUPPORTED_VERSIONS[0],
          capabilities: { tools: {} },
          serverInfo: { name: "agentoolrank", version: "1.0.0" },
          instructions: "Find and compare open-source AI agent tools. Start with search_tools, then get_tool or get_alternatives.",
        },
      };
    }
    case "ping":
      return { jsonrpc: "2.0", id, result: {} };
    case "tools/list":
      return { jsonrpc: "2.0", id, result: { tools: TOOLS } };
    case "tools/call": {
      const name = String(msg.params?.name ?? "");
      const args = (msg.params?.arguments ?? {}) as Record<string, unknown>;
      return { jsonrpc: "2.0", id, result: await callTool(name, args, deps) };
    }
    default:
      return { jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${msg.method}` } };
  }
}
