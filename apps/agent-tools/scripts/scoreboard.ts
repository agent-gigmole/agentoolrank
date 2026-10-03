/**
 * Write ops/scoreboard.json for agentkit's weekly ranking (bin/scoreboard; rule-check wants it < 26h old).
 * Revenue = stranger payments in the last 7 days minus Stripe refunds; spend = cash rows of docs/ops/spend-ledger.md;
 * visitors = distinct non-selftest sessions; bets come from ops/bets.json (this week's bets from the weekly review).
 * Usage: bun run scripts/scoreboard.ts   (run hourly from hourly-ops.sh)
 */
import { config } from "dotenv";
import { createClient } from "@libsql/client";
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { buildScoreboard, ledgerCashUsd, type PaidOrder } from "../src/lib/scoreboard";
import { ENGAGEMENT_SINCE, VISITORS_DEFINITION, classifySessions } from "../src/lib/vi-summary";

config({ path: new URL("../.env.local", import.meta.url).pathname });
const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });
const ROOT = new URL("../../../", import.meta.url).pathname;
const key = readFileSync(`${process.env.HOME}/.config/stripe/agentoolrank-ops.key`, "utf8").trim();

const now = new Date();
const since = new Date(now.getTime() - 7 * 86400_000);
const sqlTime = since.toISOString().slice(0, 19).replace("T", " ");
const day = (d: Date) => new Date(d.getTime() + 8 * 3600_000).toISOString().slice(0, 10);

async function rows(sql: string, args: string[]) {
  try {
    return (await db.execute({ sql, args })).rows;
  } catch {
    return []; // table not created yet
  }
}

async function refundedCents(session: string): Promise<number> {
  const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${session}?expand[]=payment_intent.latest_charge`, { headers: { Authorization: `Bearer ${key}` } });
  if (!res.ok) throw new Error(`stripe ${res.status} for ${session}`);
  const s = await res.json();
  return Number(s.payment_intent?.latest_charge?.amount_refunded ?? 0);
}

const payments: PaidOrder[] = [];
const warnings: string[] = []; // a Stripe hiccup must not stop the daily file; the gap is stated in the file instead
for (const r of await rows("SELECT amount_cents, stripe_session FROM payments WHERE src NOT LIKE '%selftest%' AND created_at >= ?", [sqlTime])) {
  const refunded = await refundedCents(String(r.stripe_session)).catch((e) => (warnings.push(`退款未核实：${e.message}`), 0));
  payments.push({ amountCents: Number(r.amount_cents), refundedCents: refunded });
}
// visitors_7d (agentkit 10-03 17:03): sessions with engagement; before engagement tracking existed, page_view sessions count.
const split = classifySessions(
  (await rows("SELECT MIN(ts) f, SUM(name='engagement') e FROM events WHERE src NOT LIKE '%selftest%' AND sid != 'selftest' AND name IN ('page_view','engagement') AND ts >= ? GROUP BY sid", [sqlTime]))
    .map((r) => ({ firstSeen: String(r.f), engaged: Number(r.e) > 0 })),
  ENGAGEMENT_SINCE,
);
const visitors = split.visitors;
// Spend: agentkit's spend database (bin/spend, Airwallex synced every 6h + manual entries; boss 10-03 20:08).
// If it can't be read, fall back to our own ledger and say so in warnings.
const spendDb = spawnSync(`${process.env.HOME}/project/agentkit/bin/spend`, ["--json"], { encoding: "utf8", timeout: 60_000 });
let spendUsd: number;
let spendSource = "agentkit bin/spend（~/data/spend/spend.db）近 7 天 ai-directory";
try {
  spendUsd = Number(JSON.parse(spendDb.stdout).last_7d_by_project?.["ai-directory"] ?? 0);
} catch {
  spendUsd = ledgerCashUsd(readFileSync(`${ROOT}docs/ops/spend-ledger.md`, "utf8"), day(since), day(now));
  spendSource = "docs/ops/spend-ledger.md（bin/spend 读取失败时的后备）";
  warnings.push(`bin/spend 读取失败（exit ${spendDb.status}），支出改用台账`);
}
const { bets } = JSON.parse(readFileSync(`${ROOT}ops/bets.json`, "utf8"));

const board = { ...buildScoreboard({ now, payments, spendUsd, visitors, bets }), likely_scanners_7d: split.scanners, visitors_definition: VISITORS_DEFINITION, sources: {
  revenue: "Turso payments（排除 selftest）减 Stripe 退款，滚动 7 天",
  spend: spendSource,
  visitors: "Turso events，见 visitors_definition，滚动 7 天",
  bets: "ops/bets.json（周报 docs/ops/weekly/ 的押注）",
}, warnings };
writeFileSync(`${ROOT}ops/scoreboard.json`, JSON.stringify(board, null, 2) + "\n");
console.log(`scoreboard: revenue $${board.revenue_usd_7d} · orders ${board.paid_orders_7d} · spend $${board.spend_usd_7d} · visitors ${board.visitors_7d}`);
