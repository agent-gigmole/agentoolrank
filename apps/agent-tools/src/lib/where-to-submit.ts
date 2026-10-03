import type { ProductType } from "./directory-kit";

// Indexable per-type landing pages for "where to submit a/an <type>" searches. Each one shows that type's free top 10
// from the tested-directories dataset and leads to the Submit Kit; copy is generated from the counts, never hand-typed lists.
export const WHERE_TYPES: { slug: string; type: ProductType; noun: string; Noun: string }[] = [
  { slug: "ai-tool", type: "ai_tool", noun: "an AI tool", Noun: "an AI Tool" },
  { slug: "mcp-server", type: "mcp_server", noun: "an MCP server", Noun: "an MCP Server" },
  { slug: "dev-tool", type: "dev_tool", noun: "a developer tool", Noun: "a Developer Tool" },
  { slug: "saas", type: "saas", noun: "a SaaS", Noun: "a SaaS" },
];

export function whereCopy(slug: string, o: { tested: number; fits: number; year: number }) {
  const t = WHERE_TYPES.find((w) => w.slug === slug);
  if (!t) return null;
  return {
    ...t,
    title: `Where to Submit ${t.Noun}: ${o.fits} Directories That Fit (${o.year})`,
    h1: `Where to submit ${t.noun}`,
    description: `${o.fits} launch directories that fit ${t.noun}, out of ${o.tested} we tested with our own products: free tier, link type, login, form steps.`,
  };
}
