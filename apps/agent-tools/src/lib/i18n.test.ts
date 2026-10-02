import { describe, it, expect } from "vitest";
import { localizedAlternates, parseToolTranslation, numbersPreserved, residualEnglish } from "./i18n";

describe("localizedAlternates", () => {
  it("lists every language version, itself included, plus x-default", () => {
    expect(localizedAlternates("/tool/dify", ["zh"], "zh")).toEqual({
      canonical: "https://agentoolrank.com/zh/tool/dify",
      languages: { en: "https://agentoolrank.com/tool/dify", zh: "https://agentoolrank.com/zh/tool/dify", "x-default": "https://agentoolrank.com/tool/dify" },
    });
  });
  it("gives the English page its own canonical", () => {
    expect(localizedAlternates("/tool/dify", ["zh"], "en").canonical).toBe("https://agentoolrank.com/tool/dify");
  });
  it("omits languages when no translation exists", () => {
    expect(localizedAlternates("/tool/x", [], "en")).toEqual({ canonical: "https://agentoolrank.com/tool/x" });
  });
});

describe("parseToolTranslation", () => {
  const ok = { tagline: "开源 LLM 应用开发平台", description: "Dify 是一个开源平台。", key_differentiator: "", capabilities: ["可视化编排"], best_for: [], not_for: [], limitations: [] };
  it("accepts a well-formed JSON object inside model text", () => {
    expect(parseToolTranslation("```json\n" + JSON.stringify(ok) + "\n```")).toEqual(ok);
  });
  it("rejects missing tagline or wrong types", () => {
    expect(parseToolTranslation(JSON.stringify({ ...ok, tagline: "" }))).toBeNull();
    expect(parseToolTranslation(JSON.stringify({ ...ok, capabilities: "x" }))).toBeNull();
    expect(parseToolTranslation("not json")).toBeNull();
  });
});

describe("numbersPreserved", () => {
  it("requires every number in the source to appear in the translation", () => {
    expect(numbersPreserved("Supports 100+ models and 3 SDKs", "支持 100+ 个模型和 3 个 SDK")).toBe(true);
    expect(numbersPreserved("Supports 100+ models", "支持上百个模型")).toBe(false);
  });
});

describe("residualEnglish", () => {
  it("flags long untranslated English runs but allows names and short terms", () => {
    expect(residualEnglish("Dify 是一个开源的 LLM 应用开发平台", ["Dify"])).toBe(false);
    expect(residualEnglish("Dify is an open-source platform for building apps", ["Dify"])).toBe(true);
  });
  it("flags single common English words left inside CJK text", () => {
    expect(residualEnglish("seven種類の異なるAgentフレームワーク", [])).toBe(true);
    expect(residualEnglish("支持 MCP 和 the API", [])).toBe(true);
    expect(residualEnglish("Agent ワークフローと MCP サーバー、Python SDK に対応", [])).toBe(false);
  });
});
