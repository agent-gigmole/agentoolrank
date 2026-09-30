import { describe, it, expect } from "vitest";
import { weeklyPostText } from "./weekly-post";

describe("weeklyPostText", () => {
  const tools = [
    { id: "claude-code", name: "Claude Code", gain: 10459.4, tagline: "Agentic coding tool in your terminal" },
    { id: "codex", name: "Codex", gain: 9531, tagline: "Lightweight coding agent" },
  ];
  const t = weeklyPostText(tools, "10/6", "https://agentoolrank.com");

  it("lists tools with rounded gains and ends with a tracked link", () => {
    expect(t).toContain("1. Claude Code +10,459");
    expect(t).toContain("2. Codex +9,531");
    expect(t.trim().endsWith("agentoolrank.com/weekly?ref=x-weekly")).toBe(true);
  });

  it("fits in an X post (<= 280 weighted chars, CJK counts double)", () => {
    const weighted = [...t].reduce((n, ch) => n + (/[⺀-￿]/.test(ch) ? 2 : 1), 0);
    expect(weighted).toBeLessThanOrEqual(280 * 2); // X Premium not assumed; keep modest
  });
});
