import { describe, it, expect } from "vitest";
import { wan, localToolTitle, localToolFaq, localStatus, COPY } from "./tool-i18n";

const now = new Date("2026-10-02T00:00:00Z");
const t = (o: Record<string, unknown>) => ({ name: "Dify", github_stars: 150300, commit_count_90d: 812, last_commit_date: "2026-09-30T10:00:00Z", pricing: "open-source", ...o }) as never;

describe("wan", () => {
  it("formats counts in 万 (spaced in Chinese, tight in Japanese)", () => {
    expect(wan(150300, "zh")).toBe("15 万");
    expect(wan(70700, "zh")).toBe("7.1 万");
    expect(wan(8400, "zh")).toBe("8,400");
    expect(wan(150300, "ja")).toBe("15万");
  });
});

describe("zh copy (unchanged from the first Chinese release)", () => {
  it("title", () => {
    expect(localToolTitle("zh", "Dify", "可用于生产环境的 Agent 工作流开发平台。", 150300)).toBe("Dify：可用于生产环境的 Agent 工作流开发平台 · GitHub 15 万星");
  });
  it("status", () => {
    expect(localStatus("zh", t({}), now)).toBe("仍在活跃开发：最近 90 天有 812 次提交，最近一次提交在 2026-09-30。");
    expect(localStatus("zh", t({ last_commit_date: "2026-01-21T00:00:00Z", commit_count_90d: 0 }), now)).toBe("最近一次提交在 2026-01-21，已经 8 个月没有更新。");
  });
  it("faq", () => {
    const faq = localToolFaq("zh", t({}), { tagline: "Agent 工作流开发平台", description: "Dify 是一个开源平台。" } as never, ["Flowise", "Langflow"], now);
    expect(faq.map((f) => f.q)).toEqual(["Dify 是做什么的？", "Dify 还在维护吗？", "Dify 有哪些替代品？", "Dify 是开源的吗？"]);
    expect(faq[2].a).toBe("和 Dify 最接近的开源替代品有 Flowise、Langflow。");
  });
});

describe("ja copy", () => {
  it("cuts long taglines at punctuation, not mid-word", () => {
    expect(localToolTitle("zh", "X", "面向开发者的开源智能体框架和编排平台，支持多模型路由、记忆、工具调用以及生产部署", null)).toBe("X：面向开发者的开源智能体框架和编排平台，支持多模型路由、记忆"); // ends at the last punctuation within 32 chars
  });
  it("title", () => {
    expect(localToolTitle("ja", "Dify", "本番環境向けの Agent ワークフロー開発プラットフォーム。", 150300)).toBe("Dify：本番環境向けの Agent ワークフロー開発プラットフォーム · GitHub 15万スター");
  });
  it("status", () => {
    expect(localStatus("ja", t({}), now)).toBe("現在も活発に開発中：直近 90 日間のコミットは 812 件、最新コミットは 2026-09-30。");
    expect(localStatus("ja", t({ last_commit_date: "2026-01-21T00:00:00Z", commit_count_90d: 0 }), now)).toBe("最新コミットは 2026-01-21 で、8 か月間更新がありません。");
  });
  it("faq", () => {
    const faq = localToolFaq("ja", t({}), { tagline: "x", description: "Dify はオープンソースのプラットフォームです。" } as never, ["Flowise", "Langflow"], now);
    expect(faq.map((f) => f.q)).toEqual(["Dify とは？", "Dify は現在もメンテナンスされていますか？", "Dify の代替ツールは？", "Dify はオープンソースですか？"]);
    expect(faq[2].a).toBe("Dify に近いオープンソースの代替ツール：Flowise、Langflow。");
  });
  it("has every label the page uses", () => {
    expect(Object.keys(COPY.ja).sort()).toEqual(Object.keys(COPY.zh).sort());
  });
});
