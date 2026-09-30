import { describe, it, expect } from "vitest";
import { buildReport } from "./report";

const now = new Date("2026-10-01T00:00:00Z");
const t = (id: string, stars: number, v30: number, commits: number, last: string, cats: string[]) =>
  ({ id, name: id.toUpperCase(), github_stars: stars, star_velocity_30d: v30, commit_count_90d: commits, last_commit_date: last, category_tags: cats }) as never;

describe("buildReport", () => {
  const tools = [
    t("a", 100000, 9000, 900, "2026-09-30", ["coding-agents"]),
    t("b", 50000, 12000, 50, "2026-09-29", ["mcp-servers"]),
    t("c", 20000, 10, 0, "2025-12-01", ["agent-frameworks"]),
    t("d", 3000, 300, 30, "2026-09-01", ["mcp-servers", "tool-integration"]),
  ];
  const r = buildReport(tools, now);

  it("counts tools and total stars", () => {
    expect(r.toolCount).toBe(4);
    expect(r.totalStars).toBe(173000);
  });
  it("ranks fastest growing by 30-day star pace", () => {
    expect(r.fastestGrowing.map((x) => x.id)).toEqual(["b", "a", "d", "c"]);
  });
  it("ranks most active by commits in 90 days", () => {
    expect(r.mostActive[0].id).toBe("a");
  });
  it("flags tools with no commit in 180+ days as inactive", () => {
    expect(r.inactive.map((x) => x.id)).toEqual(["c"]);
    expect(r.inactiveShare).toBeCloseTo(0.25);
  });
  it("summarizes categories by tool count and growth", () => {
    const mcp = r.categories.find((c) => c.slug === "mcp-servers")!;
    expect(mcp.tools).toBe(2);
    expect(mcp.growth30d).toBe(12300);
  });
});
