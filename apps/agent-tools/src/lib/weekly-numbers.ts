// The numbers part of the Monday weekly review (docs/ops/weekly/<monday>.md), generated from the same data as the
// scoreboard and ops/daily.md so the review never carries hand-typed numbers. Conclusions stay human / bin/write.
import type { Funnel } from "./kpi";

export interface WeeklyNumbers {
  takenAt: string;
  board: { revenue_usd_7d: number; paid_orders_7d: number; spend_usd_7d: number; profit_usd_7d: number; visitors_7d: number; likely_scanners_7d?: number };
  submit: Funnel;
  kit: Funnel;
  outreach: { sent: number; sessions7d: number };
  dirLive: number;
  gscClicks28d: number | null;
}

const usd = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;

export function scoreboardTable(w: WeeklyNumbers): string {
  const row = (k: string, v: string | number, note = "") => `| ${k} | ${v} |${note ? ` ${note} |` : ""}`;
  return [
    `## 记分牌（${w.takenAt} 自动取数）`,
    "| 指标 | 近 7 天 | 备注 |",
    "|---|---|---|",
    row("收入", usd(w.board.revenue_usd_7d)),
    row("陌生人付费单", w.board.paid_orders_7d),
    row("现金支出", usd(w.board.spend_usd_7d)),
    row("利润", usd(w.board.profit_usd_7d)),
    row("真实访客（有 engagement 的会话）", w.board.visitors_7d, `疑似扫描器 ${w.board.likely_scanners_7d ?? 0} 另列`),
    row("提交工具漏斗", `进页 ${w.submit.page} → 看到按钮 ${w.submit.seen} → 点了 ${w.submit.clicked} → 完成 ${w.submit.done}`),
    row("Submit Kit 漏斗", `进页 ${w.kit.page} → 看到按钮 ${w.kit.seen} → 点了 ${w.kit.clicked} → 付款 ${w.kit.done}`),
    row("外联", `累计 ${w.outreach.sent} 封，近 7 天 ${w.outreach.sessions7d} 个会话`),
    row("目录站已确认上线", w.dirLive),
    row("Google 点击（28 天）", w.gscClicks28d ?? "?"),
  ].join("\n");
}

/** Swap the "## 记分牌…" section for a freshly generated one; insert it after the H1 if the file has none. */
export function replaceScoreboard(doc: string, section: string): string {
  const start = doc.search(/^## 记分牌/m);
  if (start < 0) {
    const h1 = doc.indexOf("\n\n");
    return h1 < 0 ? `${doc}\n\n${section}\n` : `${doc.slice(0, h1)}\n\n${section}${doc.slice(h1)}`;
  }
  const next = doc.slice(start + 1).search(/^## /m);
  const end = next < 0 ? doc.length : start + 1 + next;
  return doc.slice(0, start) + section + "\n\n" + doc.slice(end);
}

/** docs/ops/weekly/<this date>.md: the Monday the review is due (today when it is Monday), in China time. */
export function reviewMonday(now: Date): string {
  const cst = new Date(now.getTime() + 8 * 3600_000);
  const dow = cst.getUTCDay(); // 0 Sun … 1 Mon
  const add = (8 - dow) % 7;
  return new Date(cst.getTime() + add * 86400_000).toISOString().slice(0, 10);
}
