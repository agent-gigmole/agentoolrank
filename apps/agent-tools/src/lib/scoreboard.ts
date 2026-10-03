// Machine-readable scoreboard (ops/scoreboard.json) that agentkit's bin/scoreboard ranks every Monday.
// Field names are agentkit's contract; written by scripts/scoreboard.ts, never by hand.
export interface Bet { text: string; metric: string; target: number | string; due: string; status: "open" | "hit" | "miss" }
export interface PaidOrder { amountCents: number; refundedCents: number }

const round2 = (n: number) => Math.round(n * 100) / 100;
// Spend paid from balances topped up before the window (OpenRouter credit) or the free local gateway is not new cash.
const NON_CASH = /既有余额|Sub2API/;

/** Cash spend from the ledger's 明细 table, for rows dated fromDay..toDay (inclusive, YYYY-MM-DD). */
export function ledgerCashUsd(md: string, fromDay: string, toDay: string): number {
  let total = 0;
  for (const line of md.split("\n")) {
    const cols = line.split("|").map((c) => c.trim());
    const [, day, channel, amount] = cols;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day ?? "") || day < fromDay || day > toDay || NON_CASH.test(channel)) continue;
    for (const m of amount.matchAll(/\$(\d+(?:\.\d+)?)/g)) total += Number(m[1]);
  }
  return round2(total);
}

/** ISO time in China time with an explicit offset, e.g. 2026-10-03T16:00:00+08:00. */
const cstIso = (d: Date) => new Date(d.getTime() + 8 * 3600_000).toISOString().slice(0, 19) + "+08:00";

export function buildScoreboard(o: { now: Date; payments: PaidOrder[]; spendUsd: number; visitors: number; bets: Bet[] }) {
  const net = o.payments.map((p) => p.amountCents - p.refundedCents).filter((c) => c > 0);
  const revenue = round2(net.reduce((a, c) => a + c, 0) / 100);
  return {
    updated_at: cstIso(o.now),
    revenue_usd_7d: revenue,
    paid_orders_7d: net.length,
    spend_usd_7d: o.spendUsd,
    profit_usd_7d: round2(revenue - o.spendUsd),
    visitors_7d: o.visitors,
    bets: o.bets,
  };
}
