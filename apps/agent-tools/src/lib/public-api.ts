// Shape of tools in the public JSON API and MCP server. Keep fields stable: other
// people's code and AI assistants depend on them.
import type { Tool } from "@repo/db/schema";

export interface PublicTool {
  slug: string;
  name: string;
  tagline: string;
  website: string;
  github: string | null;
  categories: string[];
  pricing: string;
  github_stars: number | null;
  stars_30d: number | null;
  last_commit: string | null;
  rank_percentile: number | null;
  capabilities: string[];
  key_differentiator: string;
  best_for: string[];
  limitations: string[];
  alternatives: string[];
  url: string;
  alternatives_url: string;
}

function intel(raw: string): Record<string, unknown> {
  try {
    const v = JSON.parse(raw || "{}");
    return typeof v === "object" && v !== null ? v : {};
  } catch {
    return {};
  }
}

const strings = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

export function toPublicTool(t: Tool, baseUrl: string): PublicTool {
  const i = intel(t.intelligence);
  return {
    slug: t.id,
    name: t.name,
    tagline: t.tagline,
    website: t.website_url,
    github: t.github_url ?? null,
    categories: t.category_tags,
    pricing: t.pricing,
    github_stars: t.github_stars,
    stars_30d: t.star_velocity_30d != null ? Math.round(t.star_velocity_30d) : null,
    last_commit: t.last_commit_date,
    rank_percentile: t.percentile_rank,
    capabilities: strings(i.capabilities),
    key_differentiator: typeof i.key_differentiator === "string" ? i.key_differentiator : "",
    best_for: strings(i.best_for),
    limitations: strings(i.limitations),
    alternatives: t.alternatives,
    url: `${baseUrl}/tool/${t.id}`,
    alternatives_url: `${baseUrl}/alternatives/${t.id}`,
  };
}

export function clampLimit(raw: string | null): number {
  const n = Number(raw);
  if (!raw || !Number.isFinite(n) || n < 1) return 20;
  return Math.min(Math.floor(n), 100);
}
