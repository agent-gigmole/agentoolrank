import { describe, it, expect } from "vitest";
import { toolTitle, compareTitle, shortTagline } from "./titles";

describe("titles", () => {
  it("toolTitle: name, short description, stars", () => {
    expect(toolTitle("Dify", "Platform for agentic workflow development.", 132400)).toBe("Dify: Platform for agentic workflow development · 132k★");
  });
  it("toolTitle stays under ~70 chars by trimming the description at a word", () => {
    const t = toolTitle("FastMCP", "The fast, Pythonic way to build MCP servers and clients with many many extra words here", 21000);
    expect(t.length).toBeLessThanOrEqual(72);
    expect(t.endsWith("· 21k★")).toBe(true);
  });
  it("toolTitle without stars or tagline", () => {
    expect(toolTitle("X", "", null)).toBe("X — Open-Source AI Agent Tool: Stats & Alternatives");
  });
  it("shortTagline strips emoji, markdown and trailing punctuation", () => {
    expect(shortTagline("🚀 **Fast** agent framework!!", 40)).toBe("Fast agent framework");
  });
  it("compareTitle", () => {
    expect(compareTitle("Claude Code", "Codex", 2026)).toBe("Claude Code vs Codex (2026): GitHub Stats, Features & Which to Choose");
  });

  it("drops a leading 'Name is a/an' so the name isn't repeated", () => {
    expect(toolTitle("Claude Code", "Claude Code is an agentic coding tool that lives in your terminal", 148700)).toBe("Claude Code: Agentic coding tool that lives in your terminal · 149k★");
  });
  it("never ends a trimmed description on a dangling connector word", () => {
    const t = toolTitle("FastMCP", "The fast, Pythonic way to build MCP servers and clients", 28000);
    expect(t).not.toMatch(/\b(and|or|the|for|with|to|of|a|an|in)\s·/);
  });
});

import { clampDescription, toolDescription } from "./titles";

describe("descriptions", () => {
  it("clampDescription cuts at a word boundary and adds an ellipsis", () => {
    const d = clampDescription("word ".repeat(60), 160);
    expect(d.length).toBeLessThanOrEqual(160);
    expect(d.endsWith("…")).toBe(true);
    expect(clampDescription("short one", 160)).toBe("short one");
  });
  it("toolDescription adds stars, activity and alternatives, within 160 chars", () => {
    const d = toolDescription({ name: "Dify", tagline: "Platform for agentic workflows.", stars: 158000, commits90: 700, alternatives: ["Flowise", "Langflow", "n8n"] });
    expect(d).toBe("Dify: Platform for agentic workflows. 158k GitHub stars, 700 commits in 90 days. Compare with Flowise, Langflow and n8n.");
    expect(d.length).toBeLessThanOrEqual(160);
  });
});
