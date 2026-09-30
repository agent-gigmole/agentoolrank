import { getCategories, getTools, getComparisonPairs, getToolCount, getLastRefreshTime } from "@repo/db/queries";
import { buildLlmsTxt } from "@/lib/llms";

export const revalidate = 43200; // 12 hours

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://agentoolrank.com";
  const [categories, tools, pairs, toolCount, refreshedAt] = await Promise.all([
    getCategories(),
    getTools({ limit: 100 }),
    getComparisonPairs(8),
    getToolCount(),
    getLastRefreshTime(),
  ]);

  const body = buildLlmsTxt({
    baseUrl,
    toolCount,
    refreshedAt: refreshedAt ? refreshedAt.slice(0, 10) : null,
    categories: categories.map((c) => ({ slug: c.slug, name: c.name, toolCount: c.tool_count ?? 0 })),
    topTools: tools.map((t) => ({ id: t.id, name: t.name, tagline: t.tagline ?? "", stars: t.github_stars ?? null })),
    comparisons: pairs.slice(0, 150),
  });

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
