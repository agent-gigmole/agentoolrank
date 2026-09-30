import { getToolBySlug } from "@repo/db/queries";
import { toPublicTool } from "@/lib/public-api";

export const revalidate = 3600;

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://agentoolrank.com";
  const { slug } = await params;
  const tool = await getToolBySlug(slug);
  const headers = { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" };
  if (!tool) return Response.json({ error: "not found" }, { status: 404, headers });
  return Response.json(toPublicTool(tool, baseUrl), { headers });
}
