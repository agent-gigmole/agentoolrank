import { describe, it, expect } from "vitest";
import { toPublicTool, clampLimit } from "./public-api";

const tool = {
  id: "dify", name: "Dify", tagline: "LLM app platform", description: "d", website_url: "https://dify.ai",
  github_url: "https://github.com/langgenius/dify", category_tags: ["agent-frameworks"], github_stars: 100000,
  star_velocity_30d: 1200.4, last_commit_date: "2026-09-30T10:00:00Z", pricing: "open-source",
  alternatives: ["flowise"], score: 0.91, percentile_rank: 97.2,
  intelligence: JSON.stringify({ capabilities: ["RAG"], key_differentiator: "visual", best_for: ["teams"], limitations: ["heavy"], secret: "x" }),
  pros: [], cons: [], affiliate_url: null,
};

describe("toPublicTool", () => {
  const p = toPublicTool(tool as never, "https://agentoolrank.com");

  it("exposes stable public fields with absolute URLs", () => {
    expect(p).toMatchObject({
      slug: "dify", name: "Dify", github_stars: 100000, stars_30d: 1200, categories: ["agent-frameworks"],
      alternatives: ["flowise"], url: "https://agentoolrank.com/tool/dify",
      alternatives_url: "https://agentoolrank.com/alternatives/dify",
    });
  });

  it("includes only whitelisted intelligence keys", () => {
    expect(p.capabilities).toEqual(["RAG"]);
    expect(p.key_differentiator).toBe("visual");
    expect(JSON.stringify(p)).not.toContain("secret");
  });

  it("survives broken intelligence JSON", () => {
    expect(toPublicTool({ ...tool, intelligence: "{" } as never, "https://x").capabilities).toEqual([]);
  });
});

describe("clampLimit", () => {
  it("defaults to 20 and caps at 100", () => {
    expect(clampLimit(null)).toBe(20);
    expect(clampLimit("500")).toBe(100);
    expect(clampLimit("abc")).toBe(20);
    expect(clampLimit("5")).toBe(5);
  });
});
