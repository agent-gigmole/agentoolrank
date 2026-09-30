import { describe, it, expect } from "vitest";
import { tokenize, rankCandidates, parseAlternativesResponse } from "./alternatives";

describe("tokenize", () => {
  it("lowercases, drops stopwords and short tokens", () => {
    expect(tokenize("The Visual RAG pipeline for LLM apps")).toEqual(["visual", "rag", "pipeline", "llm", "apps"]);
  });
});

describe("rankCandidates", () => {
  const docs = [
    { id: "dify", text: "visual workflow builder rag pipeline llm apps agent" },
    { id: "flowise", text: "drag and drop visual workflow builder llm apps agent" },
    { id: "whisper", text: "speech recognition audio transcription model" },
    { id: "langflow", text: "visual builder for rag and agent workflows" },
  ];

  it("ranks similar tools first and never includes the tool itself", () => {
    const ranked = rankCandidates("dify", docs, 2);
    expect(ranked).toHaveLength(2);
    expect(ranked).not.toContain("dify");
    expect(ranked).toEqual(expect.arrayContaining(["flowise", "langflow"]));
  });

  it("returns [] for an unknown id", () => {
    expect(rankCandidates("nope", docs, 3)).toEqual([]);
  });
});

describe("parseAlternativesResponse", () => {
  const allowed = new Set(["flowise", "langflow", "n8n"]);

  it("keeps only allowed ids, de-duplicated, in order", () => {
    const raw = 'Here you go:\n```json\n{"alternatives": ["langflow", "made-up", "flowise", "langflow"]}\n```';
    expect(parseAlternativesResponse(raw, allowed, "dify")).toEqual(["langflow", "flowise"]);
  });

  it("drops the tool itself and returns [] on garbage", () => {
    expect(parseAlternativesResponse('{"alternatives":["dify","n8n"]}', new Set(["dify", "n8n"]), "dify")).toEqual(["n8n"]);
    expect(parseAlternativesResponse("sorry, no idea", allowed, "dify")).toEqual([]);
  });
});

import { compareSlug, alternativesTitle } from "./alternatives";

describe("compareSlug", () => {
  it("orders ids alphabetically to match the canonical compare URLs", () => {
    expect(compareSlug("openhands", "aider")).toBe("aider-vs-openhands");
    expect(compareSlug("aider", "openhands")).toBe("aider-vs-openhands");
  });
});

describe("alternativesTitle", () => {
  it("includes count, name and year", () => {
    expect(alternativesTitle("Dify", 8, 2026)).toBe("8 Best Dify Alternatives in 2026 (Open Source)");
  });
  it("handles a single alternative", () => {
    expect(alternativesTitle("Dify", 1, 2026)).toBe("Best Dify Alternative in 2026 (Open Source)");
  });
});

import { taglineMentionsName } from "./alternatives";

describe("taglineMentionsName", () => {
  it("detects taglines that already start with the tool name", () => {
    expect(taglineMentionsName("Claude Code", "Claude Code is an agentic coding tool")).toBe(true);
    expect(taglineMentionsName("llama.cpp", "LLM inference in C/C++")).toBe(false);
    expect(taglineMentionsName("Dify", "")).toBe(false);
  });
});
