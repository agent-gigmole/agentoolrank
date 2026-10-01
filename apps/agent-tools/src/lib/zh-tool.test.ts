import { describe, it, expect } from "vitest";
import { wan, zhToolTitle, zhToolFaq, zhStatus } from "./zh-tool";

const now = new Date("2026-10-02T00:00:00Z");
const t = (o: Record<string, unknown>) => ({ name: "Dify", github_stars: 150300, commit_count_90d: 812, last_commit_date: "2026-09-30T10:00:00Z", pricing: "open-source", ...o }) as never;

describe("wan", () => {
  it("formats counts the Chinese way", () => {
    expect(wan(150300)).toBe("15 万");
    expect(wan(70700)).toBe("7.1 万");
    expect(wan(8400)).toBe("8,400");
  });
});

describe("zhToolTitle", () => {
  it("combines name, short tagline and stars", () => {
    expect(zhToolTitle("Dify", "可用于生产环境的 Agent 工作流开发平台。", 150300)).toBe("Dify：可用于生产环境的 Agent 工作流开发平台 · GitHub 15 万星");
  });
});

describe("zhStatus", () => {
  it("says actively developed with commit numbers", () => {
    expect(zhStatus(t({}), now)).toBe("仍在活跃开发：最近 90 天有 812 次提交，最近一次提交在 2026-09-30。");
  });
  it("says inactive after 6+ months", () => {
    expect(zhStatus(t({ last_commit_date: "2026-01-21T00:00:00Z", commit_count_90d: 0 }), now)).toBe("最近一次提交在 2026-01-21，已经 8 个月没有更新。");
  });
});

describe("zhToolFaq", () => {
  it("answers what it is, whether it is maintained, alternatives and open source", () => {
    const faq = zhToolFaq(t({}), { tagline: "Agent 工作流开发平台", description: "Dify 是一个开源平台。" } as never, ["Flowise", "Langflow"], now);
    expect(faq.map((f) => f.q)).toEqual(["Dify 是做什么的？", "Dify 还在维护吗？", "Dify 有哪些替代品？", "Dify 是开源的吗？"]);
    expect(faq[2].a).toBe("和 Dify 最接近的开源替代品有 Flowise、Langflow。");
  });
});
