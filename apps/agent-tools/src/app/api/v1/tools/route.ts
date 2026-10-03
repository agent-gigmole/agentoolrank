import { withCallLog } from "@/lib/api-log";
import { NextRequest } from "next/server";
import { getTools, searchTools } from "@repo/db/queries";
import { toPublicTool, clampLimit } from "@/lib/public-api";

// Public, read-only JSON API. GET /api/v1/tools?q=rag&category=coding-agents&sort=stars&limit=20
export const revalidate = 3600;

const SORTS = ["score", "stars", "new", "velocity"] as const;
const HEADERS = { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" };

async function handleGET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://agentoolrank.com";
  const p = req.nextUrl.searchParams;
  const limit = clampLimit(p.get("limit"));
  const q = p.get("q")?.trim().slice(0, 100);
  const sortParam = p.get("sort") as (typeof SORTS)[number] | null;
  const sort = sortParam && SORTS.includes(sortParam) ? sortParam : "score";

  const tools = q
    ? await searchTools(q, limit)
    : await getTools({ category: p.get("category") ?? undefined, limit, sort });

  return Response.json(
    { count: tools.length, tools: tools.map((t) => toPublicTool(t, baseUrl)), docs: `${baseUrl}/llms.txt` },
    { headers: HEADERS },
  );
}

export const GET = withCallLog("list_tools", handleGET);
