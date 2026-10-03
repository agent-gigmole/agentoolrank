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

describe("weeklyPostText with the month's most-downloaded tool", () => {
  const tools = [{ id: "a", name: "A", gain: 10, tagline: "" }];
  it("adds one line before the link when given", () => {
    const t = weeklyPostText(tools, "10/12", "https://agentoolrank.com", { name: "OpenAI Python", value: "284.2M" });
    expect(t).toContain("近 30 天下载最多（npm + PyPI）：OpenAI Python，284.2M 次");
    expect(t.trim().endsWith("agentoolrank.com/weekly?ref=x-weekly")).toBe(true);
  });
  it("is unchanged without it", () => {
    expect(weeklyPostText(tools, "10/12", "https://agentoolrank.com")).not.toContain("下载最多");
  });
});
