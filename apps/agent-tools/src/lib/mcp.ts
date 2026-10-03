// Minimal stateless MCP server (Streamable HTTP, JSON responses) so AI assistants
// such as Claude and Cursor can query AgentoolRank directly. Served at /api/mcp.
import type { PublicTool } from "./public-api";
import { recommendDirectories, KIT_PRICE_USD, type KitData, type ProductType } from "./directory-kit";
import kitData from "./directory-kit-data.json";

export interface McpDeps {
  search: (query: string, limit: number) => Promise<PublicTool[]>;
  get: (slug: string) => Promise<PublicTool | null>;
  getMany: (slugs: string[]) => Promise<PublicTool[]>;
  submit: (
    input: { url: unknown; name: unknown; tagline: unknown; email: unknown; github_url: unknown },
    opts: { src: string; maxBudgetUsd?: number; deadlineDays?: number; wantFeatured?: boolean },
  ) => Promise<unknown>;
  status: (id: number, token: string) => Promise<unknown | null>;
  kitKeyValid: (key: string) => Promise<boolean>;
  /** Our own listing result per directory domain (listing_checks), e.g. "Live · followed link". Optional. */
  ourListings?: () => Promise<Record<string, string>>;
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
  {
    name: "submit_tool",
    description:
      "List an AI agent tool (framework, coding agent, MCP server, memory/RAG, evals, browser agent...) on AgentoolRank for free. The free listing is queued; the response lists every paid option (price, days to go live, checkout_url for your human to pay) and recommends the cheapest one that fits max_budget_usd / deadline_days. Returns submission_id + status_token for get_submission_status, and message_for_human: a summary to forward to your human.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "Product website (https://...)" },
        name: { type: "string" },
        tagline: { type: "string", description: "One sentence, max 160 chars" },
        email: { type: "string", description: "Maker's email, used only to say when the listing is live" },
        github_url: { type: "string", description: "https://github.com/owner/repo if open source" },
        max_budget_usd: { type: "number", description: "Optional: the most your human will pay" },
        deadline_days: { type: "number", description: "Optional: must be live within this many days" },
        want_featured: { type: "boolean", description: "Optional: wants homepage placement" },
      },
      required: ["url", "name", "tagline", "email"],
    },
  },
  {
    name: "get_submission_status",
    description: "Check review status of a submission (pending/approved/rejected, queue position, listing URL).",
    inputSchema: {
      type: "object",
      properties: { submission_id: { type: "number" }, status_token: { type: "string" } },
      required: ["submission_id", "status_token"],
    },
  },
  {
    name: "recommend_directories",
    description: `Which launch directories should a product be submitted to? Returns sites our own products actually went through, each tagged auto / manual (needs one human step) with free-tier conditions, measured link type, login, human-only steps, form tips and the success signal to look for, plus one checklist of the human steps. Free: top 10. With a Submit Kit key ($${KIT_PRICE_USD} one-time): 30 sites plus a "don't submit" list with reasons. No automated submission, no captcha bypass, no traffic or ranking promised.`,
    inputSchema: {
      type: "object",
      properties: {
        product_type: { type: "string", enum: ["ai_tool", "mcp_server", "dev_tool", "saas", "other"] },
        languages: { type: "array", items: { type: "string" }, description: "Directory languages to include, default ['en'] (also: zh, fr)" },
        open_source: { type: "boolean", description: "Include directories that only list open-source projects" },
        key: { type: "string", description: "Submit Kit key for the full list (optional)" },
      },
      required: ["product_type"],
    },
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
    case "submit_tool": {
      const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
      return text(
        await deps.submit(
          { url: args.url, name: args.name, tagline: args.tagline, email: args.email, github_url: args.github_url },
          { src: "mcp", maxBudgetUsd: num(args.max_budget_usd), deadlineDays: num(args.deadline_days), wantFeatured: args.want_featured === true },
        ),
      );
    }
    case "get_submission_status": {
      const s = await deps.status(Number(args.submission_id), String(args.status_token ?? ""));
      return s ? text(s) : text("Unknown submission_id or wrong status_token.", true);
    }
    case "recommend_directories": {
      const types: ProductType[] = ["ai_tool", "mcp_server", "dev_tool", "saas", "other"];
      const productType = types.includes(args.product_type as ProductType) ? (args.product_type as ProductType) : "other";
      const key = typeof args.key === "string" ? args.key.trim() : "";
      const full = key ? await deps.kitKeyValid(key) : false;
      if (key && !full) return text("Unknown or expired Submit Kit key. Omit `key` for the free top 10.", true);
      const languages = Array.isArray(args.languages) ? args.languages.filter((l): l is string => typeof l === "string").slice(0, 5) : undefined;
      const ours = deps.ourListings ? await deps.ourListings().catch(() => ({})) : {};
      return text(recommendDirectories(kitData as KitData, { productType, full, now: new Date(), languages, openSource: args.open_source === true, ours }));
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
          instructions:
            "Find and compare open-source AI agent tools: start with search_tools, then get_tool or get_alternatives. To list a tool, call submit_tool; it returns all pricing options up front and a status token. To pick other launch directories for a product, call recommend_directories. Optional: a free API key (https://agentoolrank.com/api-key, no signup) sent as Authorization: Bearer <key> identifies your agent; everything also works without it.",
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
