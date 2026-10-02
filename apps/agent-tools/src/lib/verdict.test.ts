import { describe, it, expect } from "vitest";
import { compareVerdict, alternativesVerdict, compareDescription, alternativesDescription } from "./verdict";

const now = new Date("2026-10-01T00:00:00Z");
const t = (o: Record<string, unknown>) =>
  ({ github_stars: null, star_velocity_30d: null, commit_count_90d: null, last_commit_date: null, pricing: "open-source", tagline: "", ...o }) as never;

describe("compareVerdict", () => {
  it("flags an inactive tool against an active one", () => {
    const v = compareVerdict(t({ name: "MetaGPT", last_commit_date: "2026-01-10" }), t({ name: "CrewAI", last_commit_date: "2026-09-29", commit_count_90d: 400 }), now);
    expect(v.join(" ")).toContain("MetaGPT has had no commit in 8 months");
    expect(v.join(" ")).toContain("CrewAI is actively maintained (400 commits in the last 90 days)");
  });
  it("names the faster-growing tool only when the gap is meaningful", () => {
    const v = compareVerdict(t({ name: "A", star_velocity_30d: 2000 }), t({ name: "B", star_velocity_30d: 300 }), now);
    expect(v).toContain("A is growing faster: +2,000 GitHub stars in the last 30 days vs +300 for B.");
    const close = compareVerdict(t({ name: "A", star_velocity_30d: 1000 }), t({ name: "B", star_velocity_30d: 900 }), now);
    expect(close.join(" ")).not.toContain("growing faster");
  });
  it("rounds fractional star velocity", () => {
    expect(compareVerdict(t({ name: "A", star_velocity_30d: 4013.9 }), t({ name: "B", star_velocity_30d: 317.8 }), now)[0]).toBe("A is growing faster: +4,014 GitHub stars in the last 30 days vs +318 for B.");
  });
  it("treats free and open-source as the same pricing", () => {
    expect(compareVerdict(t({ name: "A", pricing: "free" }), t({ name: "B", pricing: "open-source" }), now)).toEqual([]);
  });
  it("keeps only the first sentence of a long tagline", () => {
    const v = compareVerdict(t({ name: "A", tagline: "Fair-code workflow automation platform with native AI capabilities. Combine visual building with custom code, 400+ integrations." }), t({ name: "B", tagline: "Run LLMs locally" }), now);
    expect(v[0]).toBe("Pick A for: fair-code workflow automation platform with native AI capabilities. Pick B for: run LLMs locally.");
  });
  it("mentions pricing only when it differs", () => {
    expect(compareVerdict(t({ name: "A", pricing: "open-source" }), t({ name: "B", pricing: "paid" }), now)).toContain("A is open-source; B is paid.");
    expect(compareVerdict(t({ name: "A" }), t({ name: "B" }), now).join(" ")).not.toContain("is paid");
  });
  it("ends with what each tool is for, from its tagline", () => {
    const v = compareVerdict(t({ name: "A", tagline: "Run LLMs locally." }), t({ name: "B", tagline: "Hosted agent platform" }), now);
    expect(v[v.length - 1]).toBe("Pick A for: run LLMs locally. Pick B for: hosted agent platform.");
  });
});

describe("alternativesVerdict", () => {
  const alts = [
    t({ name: "Scrapegraph-ai", commit_count_90d: 50, star_velocity_30d: 1928, last_commit_date: "2026-09-24" }),
    t({ name: "Crawl4AI", commit_count_90d: 300, star_velocity_30d: 3506, last_commit_date: "2026-09-25" }),
    t({ name: "GPT Crawler", commit_count_90d: 0, star_velocity_30d: 30, last_commit_date: "2025-07-07" }),
    t({ name: "LaVague", commit_count_90d: 0, star_velocity_30d: 12, last_commit_date: "2025-01-21" }),
  ];
  it("summarises closest, most active, fastest growing and inactive alternatives", () => {
    const v = alternativesVerdict(t({ name: "Firecrawl" }), alts, now);
    expect(v).toEqual([
      "Closest match to Firecrawl: Scrapegraph-ai.",
      "Most actively developed: Crawl4AI (300 commits in the last 90 days).",
      "Fastest growing: Crawl4AI (+3,506 GitHub stars in the last 30 days).",
      "No commit in 6+ months: GPT Crawler and LaVague.",
    ]);
  });
  it("returns nothing without alternatives", () => {
    expect(alternativesVerdict(t({ name: "X" }), [], now)).toEqual([]);
  });
});

describe("compareDescription", () => {
  it("leads with both star counts and the strongest data point", () => {
    const d = compareDescription(t({ name: "n8n", github_stars: 152300, star_velocity_30d: 2000 }), t({ name: "Windmill", github_stars: 15100, star_velocity_30d: 300 }), now);
    expect(d).toBe("n8n (152.3k GitHub stars) vs Windmill (15.1k): n8n is growing faster: +2,000 GitHub stars in the last 30 days vs +300 for Windmill.");
  });
  it("skips the tagline-based verdict and falls back to a generic tail", () => {
    const d = compareDescription(t({ name: "A", github_stars: 900, tagline: "Run LLMs locally" }), t({ name: "B", tagline: "Hosted agents" }), now);
    expect(d).toBe("A (900 GitHub stars) vs B: GitHub activity, pricing, pros & cons side by side, refreshed daily.");
  });
  it("never exceeds 160 characters", () => {
    const long = "X".repeat(40);
    const d = compareDescription(t({ name: long, github_stars: 1, last_commit_date: "2025-01-01" }), t({ name: long + "Y", github_stars: 2, last_commit_date: "2026-09-30", commit_count_90d: 12345 }), now);
    expect(d.length).toBeLessThanOrEqual(160);
    expect(d.startsWith(long)).toBe(true);
  });
});

describe("alternativesDescription", () => {
  const alts = [
    t({ name: "CrewAI", commit_count_90d: 120, star_velocity_30d: 800 }),
    t({ name: "AutoGen", commit_count_90d: 400, star_velocity_30d: 300 }),
    t({ name: "MetaGPT", commit_count_90d: 5, star_velocity_30d: 1500.4 }),
  ];
  it("names the closest, most active and fastest-growing alternatives with numbers", () => {
    expect(alternativesDescription(t({ name: "LangGraph" }), alts)).toBe(
      "3 LangGraph alternatives, ranked by live GitHub data. Closest: CrewAI. Most active: AutoGen (400 commits/90d). Fastest growing: MetaGPT (+1,500 stars/30d).",
    );
  });
  it("does not claim the alternatives are open source", () => {
    expect(alternativesDescription(t({ name: "X" }), alts)).not.toContain("open-source");
  });
  it("stays within 160 characters with long names", () => {
    const long = alts.map((a, i) => ({ ...(a as object), name: "VeryLongToolName".repeat(3) + i })) as never[];
    const d = alternativesDescription(t({ name: "AnotherVeryLongToolName" }), long);
    expect(d.length).toBeLessThanOrEqual(160);
    expect(d).toContain("Closest:");
  });
  it("handles a single alternative", () => {
    expect(alternativesDescription(t({ name: "A" }), [t({ name: "B" })])).toBe("1 A alternative, ranked by live GitHub data. Closest: B.");
  });
});
