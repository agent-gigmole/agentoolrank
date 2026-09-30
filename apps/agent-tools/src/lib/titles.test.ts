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
});
