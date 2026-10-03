import { describe, expect, it } from "vitest";
import { buildScoreboard, ledgerCashUsd } from "./scoreboard";

const LEDGER = `## 明细
| 日期 | 渠道 | 金额 | 用途 | 五问结论 | 封顶 / 止损 |
|---|---|---|---|---|---|
| 2026-10-01 | OpenRouter（既有余额 $22.05） | $0.26（实际）+ ≈$0.02 | x | y | z |
| 2026-09-20 | Namecheap | $12.00 | 旧 | y | z |
| 2026-10-02 | Namecheap | $9.50 + $1 | 域名 | y | z |
`;

describe("ledgerCashUsd", () => {
  it("sums cash rows dated inside the window and skips prepaid-balance spend", () => {
    expect(ledgerCashUsd(LEDGER, "2026-09-27", "2026-10-03")).toBe(10.5);
  });
  it("is 0 when nothing falls in the window", () => {
    expect(ledgerCashUsd(LEDGER, "2026-10-10", "2026-10-16")).toBe(0);
  });
});

describe("buildScoreboard", () => {
  const now = new Date("2026-10-03T08:00:00Z");
  it("nets refunds, drops fully refunded orders and derives profit", () => {
    const s = buildScoreboard({
      now,
      payments: [{ amountCents: 2900, refundedCents: 0 }, { amountCents: 900, refundedCents: 900 }, { amountCents: 1900, refundedCents: 500 }],
      spendUsd: 10.5,
      visitors: 51,
      bets: [],
    });
    expect(s).toMatchObject({ revenue_usd_7d: 43, paid_orders_7d: 2, spend_usd_7d: 10.5, profit_usd_7d: 32.5, visitors_7d: 51 });
    expect(s.updated_at).toBe("2026-10-03T16:00:00+08:00");
  });
  it("has every field rule-check requires", () => {
    const s = buildScoreboard({ now, payments: [], spendUsd: 0, visitors: 0, bets: [{ text: "t", metric: "m", target: 3, due: "2026-10-18", status: "open" }] });
    for (const k of ["updated_at", "revenue_usd_7d", "paid_orders_7d", "spend_usd_7d", "profit_usd_7d", "visitors_7d", "bets"]) expect(s).toHaveProperty(k);
    expect(s.profit_usd_7d).toBe(0);
  });
});
