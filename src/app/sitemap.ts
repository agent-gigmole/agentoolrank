import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { getComparisonPairs, getStacks } from "@/lib/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://example.com";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/new`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/weekly`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/compare`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/search`, changeFrequency: "daily", priority: 0.9 },
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
  const tools = await db.execute("SELECT id, updated_at FROM tools ORDER BY score DESC");
  const toolPages: MetadataRoute.Sitemap = tools.rows.map((row) => {
    const r = row as unknown as { id: string; updated_at: string };
    return {
      url: `${baseUrl}/tool/${r.id}`,
      lastModified: new Date(r.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    };
  });

  // Comparison pages (long-tail SEO: "X vs Y")
  const comparePairs = await getComparisonPairs(8);
  const comparePages: MetadataRoute.Sitemap = comparePairs.map((pair) => ({
    url: `${baseUrl}/compare/${pair.slugA}-vs-${pair.slugB}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  // Stack pages
  const stacks = await getStacks();
  const stackPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/stack`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    ...stacks.map((s) => ({
      url: `${baseUrl}/stack/${s.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];

  return [...staticPages, ...categoryPages, ...toolPages, ...comparePages, ...stackPages];
}
