// Structured data for /compare/<a>-vs-<b>: an ItemList of the two tools as SoftwareApplication, with 30-day npm + PyPI
// downloads as an InteractionCounter where we have a count (same numbers the page shows).
interface ToolLike { id: string; name: string; tagline?: string | null; website_url?: string | null; github_url?: string | null }

export function softwareAppJsonLd(t: ToolLike, downloads: number | null, baseUrl: string) {
  const item: Record<string, unknown> = {
    "@type": "SoftwareApplication",
    name: t.name,
    description: t.tagline ?? undefined,
    url: `${baseUrl}/tool/${t.id}`,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Cross-platform",
  };
  if (t.github_url) item.downloadUrl = t.github_url;
  if (downloads) item.interactionStatistic = { "@type": "InteractionCounter", interactionType: "https://schema.org/DownloadAction", userInteractionCount: downloads };
  return item;
}

export function compareJsonLd(a: ToolLike, b: ToolLike, dlA: number | null, dlB: number | null, baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${a.name} vs ${b.name}`,
    itemListElement: [softwareAppJsonLd(a, dlA, baseUrl), softwareAppJsonLd(b, dlB, baseUrl)].map((item, i) => ({ "@type": "ListItem", position: i + 1, item })),
  };
}
