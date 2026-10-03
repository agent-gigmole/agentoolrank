import { describe, expect, it } from "vitest";
import { ENGAGEMENT_SINCE, classifySessions, scrollBuckets, viBlock, viNote, withViBlock } from "./vi-summary";

describe("scrollBuckets", () => {
  it("uses the shared bucket edges", () => {
    expect(scrollBuckets([0, 10, 25, 26, 75, 100])).toEqual({ "0%": 1, "1–25%": 2, "26–50%": 1, "51–75%": 1, "76–100%": 1 });
  });
});

describe("viBlock", () => {
  const eng = [
    { path: "/", seconds: 5, scroll: 0 },
    { path: "/", seconds: 40, scroll: 60 },
    { path: "/tool/dify", seconds: 8, scroll: 0 },
  ];
  it("prints the same lines as agentkit vi_summary, with our source named", () => {
    const lines = viBlock({ days: 1, sinceLabel: "北京 10-03 09:00", engagement: eng, survey: [{ action: "shown", reason: "", n: 2 }], clicks: [{ label: "/submit-kit", n: 3 }] });
    expect(lines[0]).toBe("访客行为（近 1×24 小时，北京 10-03 09:00 起；自有 events 表，排除自测，访客=会话）");
    expect(lines[1]).toBe("停留：3 次页面浏览，停留中位数 8 秒，滚动中位数 0%，10 秒内离开 2 次");
    expect(lines[2]).toBe("滚动深度：0% 2 · 1–25% 0 · 26–50% 0 · 51–75% 1 · 76–100% 0");
    expect(lines[3]).toBe("各页快速离开率（<10 秒且未滚动）：/ 1/2；/tool/dify 1/1");
    expect(lines[4]).toBe("离开问卷：shown 2");
    expect(lines[5]).toBe("点击最多：/submit-kit 3");
  });
  it("says so when there is no engagement data", () => {
    expect(viBlock({ days: 1, sinceLabel: "x", engagement: [], survey: [], clicks: [] })[1]).toBe("停留：无 engagement 事件");
  });
});

describe("withViBlock", () => {
  it("puts the block first and keeps it to the markers", () => {
    const md = withViBlock(["a", "b"], "# own\n- x\n");
    expect(md).toBe("<!-- vi:start -->\na\nb\n<!-- vi:end -->\n# own\n- x\n");
  });
});

describe("viNote", () => {
  it("flags windows that include data from before the v3 scroll fix", () => {
    expect(viNote(new Date("2026-10-03T08:00:00+08:00"))).toBe("含 10-03 17:00 前数据：停留统计 10-03 16:22 才上线，之前的会话按 page_view 计入访客，停留和滚动只覆盖之后，滚动口径偏低");
    expect(viNote(new Date("2026-10-05T09:00:00+08:00"))).toBeUndefined();
    expect(viBlock({ days: 1, sinceLabel: "x", engagement: [], survey: [], clicks: [], note: "n" })[0]).toContain("访客=会话；n）");
  });
});

describe("visitors vs likely scanners (agentkit 7e90501)", () => {
  it("states both counts in the header without adding a line", () => {
    const lines = viBlock({ days: 1, sinceLabel: "x", engagement: [{ path: "/", seconds: 20, scroll: 50 }], survey: [], clicks: [], sessions: { visitors: 9, scanners: 6 } });
    expect(lines[0]).toContain("：访客 9 个会话 · 疑似扫描器 6（只有 page_view，未计入）");
    expect(lines.length).toBe(4);
  });
});

describe("classifySessions (agentkit 17:03 scoreboard rule)", () => {
  it("counts engagement sessions, and page_view-only sessions from before engagement tracking existed, as visitors", () => {
    const r = classifySessions(
      [
        { firstSeen: "2026-10-03 08:00:00", engaged: false }, // before tracking: a visitor
        { firstSeen: "2026-10-03 09:00:00", engaged: true },
        { firstSeen: "2026-10-03 09:30:00", engaged: false }, // after tracking, no engagement: likely scanner
      ],
      ENGAGEMENT_SINCE,
    );
    expect(r).toEqual({ visitors: 2, scanners: 1 });
  });
});

describe("element_seen in the vi block", () => {
  it("shares the click line so the block keeps its line budget", () => {
    const lines = viBlock({ days: 1, sinceLabel: "x", engagement: [{ path: "/", seconds: 20, scroll: 50 }], survey: [], clicks: [{ label: "kit-buy", n: 1 }], seen: [{ element: "kit_buy_button", n: 3 }] });
    expect(lines.at(-1)).toBe("点击最多：kit-buy 1；被看到（会话，露出 ≥50%）：kit_buy_button 3");
  });
});
