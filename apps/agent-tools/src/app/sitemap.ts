import type { MetadataRoute } from "next";
import { db } from "@repo/db";
import { getComparisonPairs, getStacks } from "@repo/db/queries";
import { pairsFromAlternatives } from "@/lib/alternatives";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://example.com";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/new`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/weekly`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/compare`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/search`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/submit`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/agents`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/where-to-list`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/report`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    // Chinese locale pages
    { url: `${baseUrl}/zh`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/zh/blueprint`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/zh/search`, changeFrequency: "daily", priority: 0.9 },
  ];

  // Category pages
  const categories = await db.execute("SELECT slug FROM categories");
  const categoryPages: MetadataRoute.Sitemap = categories.rows.map((row) => ({
    url: `${baseUrl}/category/${(row as unknown as { slug: string }).slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // Tool detail pages (the SEO long-tail gold)
  const tools = await db.execute("SELECT id, updated_at, data_refreshed_at FROM tools ORDER BY score DESC");
  const toolPages: MetadataRoute.Sitemap = tools.rows.map((row) => {
    const r = row as unknown as { id: string; updated_at: string; data_refreshed_at: string | null };
    const last = [r.updated_at, r.data_refreshed_at].filter(Boolean).sort().pop()!;
    return {
      url: `${baseUrl}/tool/${r.id}`,
      lastModified: new Date(last),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    };
  });

  // Alternatives pages (high-intent: "X alternatives")
  const withAlts = await db.execute("SELECT id, data_refreshed_at FROM tools WHERE alternatives IS NOT NULL AND alternatives != '[]' ORDER BY score DESC");
  const alternativesPages: MetadataRoute.Sitemap = withAlts.rows.map((row) => ({
    url: `${baseUrl}/alternatives/${(row as unknown as { id: string }).id}`,
    lastModified: new Date(String((row as unknown as { data_refreshed_at: string }).data_refreshed_at ?? Date.now())),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Comparison pages (long-tail SEO: "X vs Y")
  const comparePairs = await getComparisonPairs(8);
  // Plus each top tool vs its closest alternatives (higher-intent pairs than same-category combos)
  const topWithAlts = await db.execute("SELECT id, alternatives FROM tools WHERE alternatives != '[]' ORDER BY score DESC LIMIT 150");
  const altPairs = pairsFromAlternatives(
    topWithAlts.rows.map((r) => {
      const row = r as unknown as { id: string; alternatives: string };
      let alts: string[] = [];
      try { alts = JSON.parse(row.alternatives); } catch {}
      return { id: row.id, alternatives: alts };
    }),
    3,
  );
  const compareSlugs = [...new Set([...comparePairs.map((p) => `${p.slugA}-vs-${p.slugB}`), ...altPairs])];
  const comparePages: MetadataRoute.Sitemap = compareSlugs.map((slug) => ({
    url: `${baseUrl}/compare/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  // Stack / Blueprint pages
  const stacks = await getStacks();
  const stackPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/stack`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${baseUrl}/blueprint`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
    ...stacks.map((s) => ({
      url: `${baseUrl}/stack/${s.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: s.slug.startsWith("custom-") ? 0.4 : 0.5,
    })),
  ];

  // Blueprint pages (canonical URLs for blueprints)
  const blueprintPages: MetadataRoute.Sitemap = stacks.map((s) => ({
    url: `${baseUrl}/blueprint/${s.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: s.slug.startsWith("custom-") ? 0.6 : 0.7,
  }));

  return [...staticPages, ...categoryPages, ...toolPages, ...alternativesPages, ...comparePages, ...stackPages, ...blueprintPages];
}
