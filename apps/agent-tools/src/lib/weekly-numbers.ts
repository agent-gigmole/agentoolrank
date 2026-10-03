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
