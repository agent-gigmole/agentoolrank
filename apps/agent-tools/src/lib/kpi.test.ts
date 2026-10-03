import { describe, it, expect } from "vitest";
import { cstDayRange, renderKpi, replaceBlock } from "./kpi";

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
