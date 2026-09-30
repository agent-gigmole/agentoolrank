import { NextRequest } from "next/server";
import { getToolBySlug, searchTools } from "@repo/db/queries";
import { toPublicTool } from "@/lib/public-api";
import { handleMcp, type McpDeps } from "@/lib/mcp";

// MCP endpoint (Streamable HTTP, stateless, JSON responses only — no SSE stream).
// Add to a client as: { "url": "https://agentoolrank.com/api/mcp" }
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Mcp-Session-Id, Mcp-Protocol-Version",
};

function deps(): McpDeps {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://agentoolrank.com";
  return {
    search: async (q, limit) => (await searchTools(q, limit)).map((t) => toPublicTool(t, baseUrl)),
    get: async (slug) => {
      const t = await getToolBySlug(slug);
      return t ? toPublicTool(t, baseUrl) : null;
    },
    getMany: async (slugs) =>
      (await Promise.all(slugs.map((s) => getToolBySlug(s)))).filter((t) => t !== null).map((t) => toPublicTool(t, baseUrl)),
  };
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, { status: 400, headers: CORS });
  }
  const d = deps();
  const messages = Array.isArray(body) ? body : [body];
  const responses = (await Promise.all(messages.map((m) => handleMcp(m, d)))).filter((r) => r !== null);
  if (responses.length === 0) return new Response(null, { status: 202, headers: CORS });
  return Response.json(Array.isArray(body) ? responses : responses[0], { headers: CORS });
}

export async function GET() {
  // No server-initiated stream; clients should POST.
  return new Response("AgentoolRank MCP server. POST JSON-RPC here. Tools: search_tools, get_tool, get_alternatives.", {
    status: 405,
    headers: { ...CORS, Allow: "POST, OPTIONS" },
  });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
