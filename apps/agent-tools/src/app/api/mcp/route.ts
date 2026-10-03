import { db } from "@repo/db";
import { recordCall } from "@/lib/api-usage";
import { NextRequest, after } from "next/server";
import { getToolBySlug, searchTools } from "@repo/db/queries";
import { toPublicTool } from "@/lib/public-api";
import { handleMcp, type McpDeps } from "@/lib/mcp";
import { createSubmission, submissionStatus } from "@/lib/submit-core";
import { listedReply } from "@/lib/offers";
import { badgeHtml } from "@/lib/submissions";
import { kitKeyValid } from "@/lib/kit-keys";
import { ourResultLabel } from "@/lib/listing-check";

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
    submit: async (input, opts) => {
      const r = await createSubmission(input, opts);
      if (r.kind === "invalid") return { status: "invalid", errors: r.errors };
      if (r.kind === "spam") return { status: "invalid" };
      if (r.kind === "listed") return listedReply({ baseUrl: baseUrl, slug: r.slug, listingUrl: r.url, paymentsEnabled: Boolean(process.env.STRIPE_SECRET_KEY), badgeHtml: badgeHtml(baseUrl, r.slug, typeof input.name === "string" ? input.name : r.slug) });
      const { kind: _kind, ...rest } = r;
      return { status: "queued", ...rest };
    },
    status: (id, token) => submissionStatus(id, token),
    kitKeyValid,
    ourListings: async () => {
      const r = await db.execute("SELECT domain, state, rel, target FROM listing_checks");
      return Object.fromEntries(r.rows.map((x) => [String(x.domain), ourResultLabel({ state: String(x.state), rel: x.rel === null ? null : String(x.rel), target: x.target === null ? null : String(x.target) })]));
    },
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
  const ua = req.headers.get("user-agent") ?? "";
  const headerKey = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "") || req.headers.get("x-api-key") || "";
  const responses = (
    await Promise.all(
      messages.map(async (m) => {
        if (m?.method !== "tools/call") return handleMcp(m, d);
        // Log every tool call (api_calls): which tools agents actually use, with or without a key (credits decision 10-03).
        const t0 = Date.now();
        const r = await handleMcp(m, d);
        const args = (m.params?.arguments ?? {}) as Record<string, unknown>;
        // after(): the insert runs once the response is sent, and the platform keeps the function alive for it
        // (a bare un-awaited promise can be dropped on Vercel — 10-03 a keyed call was lost that way).
        const call = {
          surface: "mcp",
          tool: String(m.params?.name ?? ""),
          ok: !!r && !("error" in r && r.error) && !(r as { result?: { isError?: boolean } }).result?.isError,
          ms: Date.now() - t0,
          key: (typeof args.key === "string" && args.key) || headerKey || undefined,
          ua,
          src: typeof args.src === "string" ? args.src : "",
        } as const;
        after(() => recordCall((q) => db.execute(q), call));
        return r;
      }),
    )
  ).filter((r) => r !== null);
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
