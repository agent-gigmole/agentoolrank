/**
 * Refresh the daily KPI block at the top of the ops dashboard (between <!-- KPI:START --> / <!-- KPI:END -->).
 * Usage: bun run scripts/kpi.ts   (run hourly from hourly-ops.sh)
 */
import { config } from "dotenv";
import { createClient } from "@libsql/client";
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { cstDayRange, renderKpi, replaceBlock, type Window } from "../src/lib/kpi";

config({ path: new URL("../.env.local", import.meta.url).pathname });
const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });
const DASH = new URL("../../../docs/ops/overview/index.html", import.meta.url).pathname;
const REAL_EV = "src NOT LIKE '%selftest%' AND sid != 'selftest'";
const REAL_SUB = "src NOT LIKE '%selftest%' AND note NOT LIKE '%selftest%'";
const REAL_PAY = "src NOT LIKE '%selftest%'";

async function n(sql: string, args: string[] = []): Promise<number> {
  try {
    return Number((await db.execute({ sql, args })).rows[0]?.n ?? 0);
  } catch {
    return 0; // table not created yet
  }
}

async function window(from: string, to: string): Promise<Window> {
  return {
    visitors: await n(`SELECT COUNT(DISTINCT sid) n FROM events WHERE ${REAL_EV} AND name='page_view' AND ts >= ? AND ts < ?`, [from, to]),
    submitViews: await n(`SELECT COUNT(DISTINCT sid) n FROM events WHERE ${REAL_EV} AND name='page_view' AND path='/submit' AND ts >= ? AND ts < ?`, [from, to]),
    submissions: await n(`SELECT COUNT(*) n FROM submissions WHERE ${REAL_SUB} AND created_at >= ? AND created_at < ?`, [from, to]),
    paid: await n(`SELECT COUNT(*) n FROM payments WHERE ${REAL_PAY} AND created_at >= ? AND created_at < ?`, [from, to]),
    revenueCents: await n(`SELECT COALESCE(SUM(amount_cents),0) n FROM payments WHERE ${REAL_PAY} AND created_at >= ? AND created_at < ?`, [from, to]),
  };
}

function latestGscClicks(): number | null {
  const dir = new URL("../data/ops-logs/", import.meta.url).pathname;
  const logs = readdirSync(dir).filter((f) => /^\d{4}-\d{2}-\d{2}\.log$/.test(f)).sort().reverse();
  for (const f of logs) {
    const m = [...readFileSync(dir + f, "utf8").matchAll(/GSC last 28d: clicks (\d+)/g)].pop();
    if (m) return Number(m[1]);
  }
  return null;
}

/** Our latest status per directory domain from the shared submission log (~/data/backlinks/directory-log.csv). */
function directoryCounts(): { submitted: number; live: number } {
  const f = `${process.env.HOME}/data/backlinks/directory-log.csv`;
  if (!existsSync(f)) return { submitted: 0, live: 0 };
  const last = new Map<string, string[]>();
  for (const line of readFileSync(f, "utf8").split("\n").slice(1)) {
    const cols = line.match(/("([^"]|"")*"|[^,]*)(,|$)/g)?.map((c) => c.replace(/,$/, "").replace(/^"|"$/g, "")) ?? [];
    if (cols[2] === "ai-directory") last.set(cols[0], cols);
  }
  const rows = [...last.values()].filter((c) => c[3] === "submitted");
  return { submitted: rows.length, live: rows.filter((c) => /已上线|is live|已发布/.test(c.slice(4).join(","))).length };
}

const now = new Date();
const y = cstDayRange(now, -1);
const wk = cstDayRange(now, -7);
const today = cstDayRange(now, 0);
const monthStart = `${today.day.slice(0, 8)}01`;
const html = renderKpi({
  generated: new Date(now.getTime() + 8 * 3600_000).toISOString().slice(0, 16).replace("T", " "),
  day: y.day,
  yesterday: await window(y.from, y.to),
  week: await window(wk.from, today.to),
  totalRevenueCents: await n(`SELECT COALESCE(SUM(amount_cents),0) n FROM payments WHERE ${REAL_PAY}`),
  externalSubmissions: await n(`SELECT COUNT(*) n FROM submissions WHERE ${REAL_SUB}`),
  monthRevenueCents: await n(`SELECT COALESCE(SUM(amount_cents),0) n FROM payments WHERE ${REAL_PAY} AND created_at >= ?`, [cstDayRange(new Date(`${monthStart}T12:00:00+08:00`), 0).from]),
  gscClicks28d: latestGscClicks(),
  zhVisitors7d: await n(`SELECT COUNT(DISTINCT sid) n FROM events WHERE ${REAL_EV} AND name='page_view' AND path LIKE '/zh%' AND ts >= ?`, [wk.from]),
  jaVisitors7d: await n(`SELECT COUNT(DISTINCT sid) n FROM events WHERE ${REAL_EV} AND name='page_view' AND path LIKE '/ja%' AND ts >= ?`, [wk.from]),
  outreachSent: existsSync(new URL("../data/outreach/sent.json", import.meta.url)) ? JSON.parse(readFileSync(new URL("../data/outreach/sent.json", import.meta.url), "utf8")).length : 0,
  outreachVisitors7d: await n(`SELECT COUNT(DISTINCT sid) n FROM events WHERE ${REAL_EV} AND src LIKE '%outreach%' AND ts >= ?`, [wk.from]),
  dirSubmitted: directoryCounts().submitted,
  dirLive: directoryCounts().live,
});
writeFileSync(DASH, replaceBlock(readFileSync(DASH, "utf8"), html));
console.log(`kpi updated for ${y.day}`);
