// The visitor-insights daily block for ops/daily.md, computed from our own events table.
// Lines match agentkit's skills/visitor-insights vi_summary.py so every project's report reads the same.
export interface Engagement { path: string; seconds: number; scroll: number }
export const VI_START = "<!-- vi:start -->";
export const VI_END = "<!-- vi:end -->";

const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export function scrollBuckets(scrolls: number[]) {
  const b: Record<string, number> = { "0%": 0, "1–25%": 0, "26–50%": 0, "51–75%": 0, "76–100%": 0 };
  for (const s of scrolls) b[s <= 0 ? "0%" : s <= 25 ? "1–25%" : s <= 50 ? "26–50%" : s <= 75 ? "51–75%" : "76–100%"]++;
  return b;
}

export function viBlock(o: {
  days: number; sinceLabel: string; engagement: Engagement[]; note?: string;
  /** Visitors = sessions that sent an engagement event; page_view-only sessions are likely JS-running scanners. */
  sessions?: { visitors: number; scanners: number };
  survey: { action: string; reason: string; n: number }[]; clicks: { label: string; n: number }[];
}): string[] {
  const out = [`访客行为（近 ${o.days}×24 小时，${o.sinceLabel} 起；自有 events 表，排除自测，访客=会话${o.note ? `；${o.note}` : ""}）`];
  if (o.sessions) out[0] += `：访客 ${o.sessions.visitors} 个会话 · 疑似扫描器 ${o.sessions.scanners}（只有 page_view，未计入）`;
  const e = o.engagement;
  if (!e.length) return [...out, "停留：无 engagement 事件"];
  const short = e.filter((x) => x.seconds < 10).length;
  out.push(`停留：${e.length} 次页面浏览，停留中位数 ${Math.round(median(e.map((x) => x.seconds)))} 秒，滚动中位数 ${Math.round(median(e.map((x) => x.scroll)))}%，10 秒内离开 ${short} 次`);
  out.push("滚动深度：" + Object.entries(scrollBuckets(e.map((x) => x.scroll))).map(([k, v]) => `${k} ${v}`).join(" · "));
  const pages = new Map<string, { v: number; q: number }>();
  for (const x of e) {
    const p = pages.get(x.path) ?? { v: 0, q: 0 };
    p.v++;
    if (x.seconds < 10 && x.scroll === 0) p.q++;
    pages.set(x.path, p);
  }
  const top = [...pages].sort((a, b) => b[1].v - a[1].v).slice(0, 5);
  out.push("各页快速离开率（<10 秒且未滚动）：" + top.map(([p, { v, q }]) => `${p} ${q}/${v}`).join("；"));
  if (o.survey.length) out.push("离开问卷：" + o.survey.map((s) => `${s.action}${s.reason ? `·${s.reason}` : ""} ${s.n}`).join("，"));
  if (o.clicks.length) out.push("点击最多：" + o.clicks.map((c) => `${c.label} ${c.n}`).join("，"));
  return out;
}

/** The vi block goes first so it always falls inside the 15 lines agentkit's daily report attaches. */
export function withViBlock(lines: string[], rest: string): string {
  return [VI_START, ...lines, VI_END].join("\n") + "\n" + rest;
}

/** Data before the v3 fix (short pages counted 0% scrolled) overlaps the window: the report must say so. */
export const VI_V3_SINCE = new Date("2026-10-03T17:00:00+08:00");
export const viNote = (since: Date) => (since < VI_V3_SINCE ? "含 10-03 17:00 前数据：停留统计 10-03 16:30 才上线，之前的会话都落在疑似扫描器里，滚动口径也偏低" : undefined);
