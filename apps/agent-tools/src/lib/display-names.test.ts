import { describe, it, expect } from "vitest";
import { needsDisplayName, parseDisplayNames } from "./display-names";

describe("needsDisplayName", () => {
  it("flags lowercase repo-style names only", () => {
    expect(needsDisplayName("claude-code")).toBe(true);
    expect(needsDisplayName("n8n")).toBe(true);
    expect(needsDisplayName("llama.cpp")).toBe(true);
    expect(needsDisplayName("LangChain")).toBe(false);
    expect(needsDisplayName("Open WebUI")).toBe(false);
  });
});

describe("parseDisplayNames", () => {
  const ids = new Set(["claude-code", "llama-cpp", "n8n"]);

  it("keeps sane names for known ids", () => {
    const raw = '```json\n{"claude-code":"Claude Code","llama-cpp":"llama.cpp","n8n":"n8n","other":"X"}\n```';
    expect(parseDisplayNames(raw, ids)).toEqual({ "claude-code": "Claude Code", "llama-cpp": "llama.cpp", n8n: "n8n" });
  });

  it("drops empty, too long, or multi-line names", () => {
    const raw = JSON.stringify({ "claude-code": "", "llama-cpp": "x".repeat(61), n8n: "a\nb" });
    expect(parseDisplayNames(raw, ids)).toEqual({});
  });

  it("returns {} on garbage", () => {
    expect(parseDisplayNames("no json", ids)).toEqual({});
  });
});
