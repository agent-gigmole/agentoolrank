/**
 * Funnel report from first-party events + submissions (excludes selftest traffic).
 * Usage: bun run scripts/funnel-report.ts [days=7]
 */
import { config } from "dotenv";
import { createClient } from "@libsql/client";

config({ path: new URL("../.env.local", import.meta.url).pathname });
const days = Number(process.argv[2] ?? 7);
const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });
const since = `datetime('now', '-${days} days')`;
const real = `ts >= ${since} AND src NOT LIKE '%selftest%' AND sid != 'selftest'`;

async function q<T = Record<string, unknown>>(sql: string): Promise<T[]> {
  return (await db.execute(sql)).rows as unknown as T[];
}

async function main() {
  const [sessions] = await q<{ n: number }>(`SELECT COUNT(DISTINCT sid) n FROM events WHERE ${real} AND name='page_view'`);
  const [views] = await q<{ n: number }>(`SELECT COUNT(*) n FROM events WHERE ${real} AND name='page_view'`);
  const [submitView] = await q<{ n: number }>(`SELECT COUNT(DISTINCT sid) n FROM events WHERE ${real} AND name='page_view' AND path='/submit'`);
  const [submitDone] = await q<{ n: number }>(`SELECT COUNT(*) n FROM submissions WHERE created_at >= ${since} AND src NOT LIKE '%selftest%' AND note NOT LIKE '%selftest%'`).catch(() => [{ n: 0 }]);
  const [paid] = await q<{ n: number }>(`SELECT COUNT(*) n FROM submissions WHERE created_at >= ${since} AND plan != 'free'`).catch(() => [{ n: 0 }]);

  console.log(`Last ${days} days`);
  console.log(`  sessions        ${sessions.n}`);
  console.log(`  page views      ${views.n}`);
  console.log(`  /submit viewed  ${submitView.n}`);
  console.log(`  submissions     ${submitDone.n}`);
  console.log(`  paid            ${paid.n}`);

  console.log("Top pages");
  for (const r of await q<{ path: string; n: number }>(`SELECT path, COUNT(*) n FROM events WHERE ${real} AND name='page_view' GROUP BY path ORDER BY n DESC LIMIT 10`)) console.log(`  ${r.n}\t${r.path}`);
  console.log("Top referrers / sources");
  for (const r of await q<{ k: string; n: number }>(`SELECT COALESCE(NULLIF(src,''), NULLIF(ref,''), '(direct)') k, COUNT(DISTINCT sid) n FROM events WHERE ${real} GROUP BY k ORDER BY n DESC LIMIT 10`)) console.log(`  ${r.n}\t${r.k}`);
  console.log("Outbound clicks");
  for (const r of await q<{ path: string; n: number }>(`SELECT path, COUNT(*) n FROM events WHERE ${real} AND name='outbound_click' GROUP BY path ORDER BY n DESC LIMIT 10`)) console.log(`  ${r.n}\t${r.path}`);
}

main();
