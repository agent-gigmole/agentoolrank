// Monthly "State of open-source AI agent tools" numbers, computed from tracked GitHub data.
import type { Tool } from "@repo/db/schema";

type T = Pick<Tool, "id" | "name" | "github_stars" | "star_velocity_30d" | "commit_count_90d" | "last_commit_date" | "category_tags">;

export function buildReport(tools: T[], now: Date) {
  const days = (d: string | null) => (d ? (now.getTime() - new Date(d).getTime()) / 86400000 : Infinity);
  const withStars = tools.filter((t) => t.github_stars != null);
  const inactive = tools.filter((t) => days(t.last_commit_date) >= 180);
  const cats = new Map<string, { slug: string; tools: number; stars: number; growth30d: number }>();
  for (const t of tools) {
    for (const c of t.category_tags) {
      const e = cats.get(c) ?? { slug: c, tools: 0, stars: 0, growth30d: 0 };
      e.tools++;
      e.stars += t.github_stars ?? 0;
      e.growth30d += Math.round(t.star_velocity_30d ?? 0);
      cats.set(c, e);
    }
  }
  return {
    toolCount: tools.length,
    totalStars: withStars.reduce((s, t) => s + (t.github_stars ?? 0), 0),
    fastestGrowing: [...tools].filter((t) => t.star_velocity_30d != null).sort((a, b) => (b.star_velocity_30d ?? 0) - (a.star_velocity_30d ?? 0)).slice(0, 15),
    mostActive: [...tools].filter((t) => t.commit_count_90d != null).sort((a, b) => (b.commit_count_90d ?? 0) - (a.commit_count_90d ?? 0)).slice(0, 10),
    inactive: inactive.sort((a, b) => (b.github_stars ?? 0) - (a.github_stars ?? 0)),
    inactiveShare: tools.length ? inactive.length / tools.length : 0,
    categories: [...cats.values()].sort((a, b) => b.growth30d - a.growth30d),
  };
}
