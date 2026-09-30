import { describe, it, expect } from "vitest";
import { buildLlmsTxt } from "./llms";

const input = {
  baseUrl: "https://agentoolrank.com",
  toolCount: 464,
  refreshedAt: "2026-10-01",
  categories: [{ slug: "coding-agents", name: "Coding Agents", toolCount: 40 }],
  topTools: [
    { id: "dify", name: "Dify", tagline: "LLM app platform", stars: 100000 },
    { id: "no-tagline", name: "Bare", tagline: "", stars: null },
  ],
  comparisons: [{ slugA: "dify", slugB: "flowise", nameA: "Dify", nameB: "Flowise" }],
};

describe("buildLlmsTxt", () => {
  const txt = buildLlmsTxt(input);

  it("starts with an H1 title and a blockquote summary (llms.txt spec)", () => {
    const lines = txt.split("\n");
    expect(lines[0]).toBe("# AgentoolRank");
    expect(lines.find((l) => l.startsWith("> "))).toMatch(/464 .*AI agent tools/);
  });

  it("links tools, categories and comparisons with absolute URLs", () => {
    expect(txt).toContain("- [Dify](https://agentoolrank.com/tool/dify): LLM app platform (100,000 GitHub stars)");
    expect(txt).toContain("- [Coding Agents](https://agentoolrank.com/category/coding-agents): 40 tools");
    expect(txt).toContain("- [Dify vs Flowise](https://agentoolrank.com/compare/dify-vs-flowise)");
  });

  it("omits empty taglines and missing stars instead of printing blanks", () => {
    expect(txt).toContain("- [Bare](https://agentoolrank.com/tool/no-tagline)\n");
    expect(txt).not.toMatch(/null|undefined|: \(/);
  });

  it("states data freshness", () => {
    expect(txt).toContain("2026-10-01");
  });
});
