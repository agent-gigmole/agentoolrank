import { describe, it, expect } from "vitest";
import { cstDayRange, renderDaily, renderKpi, replaceBlock } from "./kpi";

describe("cstDayRange", () => {
  it("maps a China-time day to UTC SQLite bounds", () => {
    expect(cstDayRange(new Date("2026-10-02T01:30:00Z"), -1)).toEqual({ day: "2026-10-01", from: "2026-09-30 16:00:00", to: "2026-10-01 16:00:00" });
    expect(cstDayRange(new Date("2026-10-01T17:00:00Z"), 0).day).toBe("2026-10-02");
  });
});

describe("renderKpi", () => {
  const html = renderKpi({
    generated: "2026-10-02 09:00", day: "2026-10-01",
    yesterday: { visitors: 14, submitViews: 2, submissions: 0, paid: 0, revenueCents: 0 },
    week: { visitors: 80, submitViews: 9, submissions: 1, paid: 1, revenueCents: 900 },
    totalRevenueCents: 900, externalSubmissions: 3, monthRevenueCents: 900, gscClicks28d: 3, zhVisitors7d: 4,
    jaVisitors7d: 2, outreachSent: 10, outreachVisitors7d: 4, dirSubmitted: 41, dirLive: 6,
  });
  it("shows the four daily KPIs", () => {
    expect(html).toContain("<b>14</b><span>访客（10-01）");
    expect(html).toContain("<b>0</b><span>提交（10-01）");
    expect(html).toContain("<b>$9</b><span>近 7 天收入 · 1 单");
  });
  it("shows the standing metrics the owner asked about", () => {
    expect(html).toContain("外联：累计发出 10 封 · 近 7 天带来 4 个会话");
    expect(html).toContain("目录站：已提交 41 · 已确认上线 6");
    expect(html).toContain("中文页访客 7 天 4 · 日文页 2");
  });
  it("shows goal progress against G2-G4", () => {
    expect(html).toContain("G2 外部提交 3/20");
    expect(html).toContain("G3 首笔陌生人付款 ✅");
    expect(html).toContain("G4 月收入 $9/$300");
    expect(html).toContain("Google 点击 3/1000");
  });
});

describe("replaceBlock", () => {
  it("replaces content between markers only", () => {
    expect(replaceBlock("a<!-- KPI:START -->old<!-- KPI:END -->b", "new")).toBe("a<!-- KPI:START -->new<!-- KPI:END -->b");
  });
  it("throws when markers are missing", () => {
    expect(() => replaceBlock("no markers", "x")).toThrow();
  });
});

describe("renderDaily", () => {
  const d = {
    generated: "2026-10-04 09:00", day: "2026-10-03",
    yesterday: { visitors: 14, submitViews: 2, submissions: 1, paid: 0, revenueCents: 0 },
    week: { visitors: 80, submitViews: 9, submissions: 3, paid: 1, revenueCents: 2900 },
    totalRevenueCents: 2900, externalSubmissions: 3, monthRevenueCents: 2900, gscClicks28d: 3, zhVisitors7d: 4,
    jaVisitors7d: 2, outreachSent: 20, outreachVisitors7d: 5, dirSubmitted: 41, dirLive: 6, kitOrders7d: 1, devtoVisitors7d: 7,
  };
  const md = renderDaily(d);
  it("leaves room for the vi block inside the 15 lines agentkit appends", () => {
    expect(md.trimEnd().split("\n").length).toBeLessThanOrEqual(7);
  });
  it("carries the project-specific numbers the scoreboard lacks", () => {
    expect(md).toContain("外联：累计 20 封，近 7 天带来 5 个会话");
    expect(md).toContain("目录站：已提交 41，已确认上线 6");
    expect(md).toContain("Submit Kit：近 7 天 1 单");
    expect(md).toContain("工具提交：昨天 1，近 7 天 3（提交页访客 9）");
    expect(md).toContain("dev.to 来源 7 天 7");
    expect(md).toContain("Google 点击 28 天 3");
  });
});
