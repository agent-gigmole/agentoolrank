import { describe, expect, it } from "vitest";
import { scoreboardTable } from "./weekly-numbers";

describe("scoreboardTable (weekly review 记分牌, generated not typed)", () => {
  it("renders the scoreboard and funnels as a markdown table with the source time", () => {
    const md = scoreboardTable({
      takenAt: "2026-10-05 09:00",
      board: { revenue_usd_7d: 29, paid_orders_7d: 1, spend_usd_7d: 0, profit_usd_7d: 29, visitors_7d: 80, likely_scanners_7d: 6 },
      submit: { page: 9, seen: 5, clicked: 2, done: 1 },
      kit: { page: 4, seen: 3, clicked: 1, done: 1 },
      outreach: { sent: 20, sessions7d: 5 },
      dirLive: 7,
      gscClicks28d: 3,
    });
    expect(md.split("\n")[0]).toBe("## 记分牌（2026-10-05 09:00 自动取数）");
    expect(md).toContain("| 收入 | $29 |");
    expect(md).toContain("| 陌生人付费单 | 1 |");
    expect(md).toContain("| 利润 | $29 |");
    expect(md).toContain("| 真实访客（有 engagement 的会话） | 80 | 疑似扫描器 6 另列 |");
    expect(md).toContain("| 提交工具漏斗 | 进页 9 → 看到按钮 5 → 点了 2 → 完成 1 |");
    expect(md).toContain("| Submit Kit 漏斗 | 进页 4 → 看到按钮 3 → 点了 1 → 付款 1 |");
    expect(md).toContain("| 外联 | 累计 20 封，近 7 天 5 个会话 |");
    expect(md).toContain("| 目录站已确认上线 | 7 |");
  });
});

describe("replaceScoreboard / reviewMonday", () => {
  it("replaces only the 记分牌 section and keeps the rest", async () => {
    const { replaceScoreboard } = await import("./weekly-numbers");
    const doc = "# 本周经营\n\n## 记分牌（旧）\n| a |\n\n## 外部评测\nkeep\n";
    expect(replaceScoreboard(doc, "## 记分牌（新）\n| b |")).toBe("# 本周经营\n\n## 记分牌（新）\n| b |\n\n## 外部评测\nkeep\n");
  });
  it("inserts the section after the title when missing", async () => {
    const { replaceScoreboard } = await import("./weekly-numbers");
    expect(replaceScoreboard("# T\n\n## 押注\nx\n", "## 记分牌\n| b |")).toBe("# T\n\n## 记分牌\n| b |\n\n## 押注\nx\n");
  });
  it("reviews belong to the coming Monday (or today if it is Monday), China time", async () => {
    const { reviewMonday } = await import("./weekly-numbers");
    expect(reviewMonday(new Date("2026-10-03T12:00:00+08:00"))).toBe("2026-10-05");
    expect(reviewMonday(new Date("2026-10-05T08:50:00+08:00"))).toBe("2026-10-05");
    expect(reviewMonday(new Date("2026-10-05T23:59:00+08:00"))).toBe("2026-10-05");
  });
});
