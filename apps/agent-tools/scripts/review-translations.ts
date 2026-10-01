/**
 * Owner review of translations before they go live.
 *   --list [--limit=10]            print approved-but-unreviewed rows (source vs translation), highest score first
 *   --mark=id1,id2 [--level=1|2]   publish: 1 = read in full, 2 = batch passed a sample read
 *   --reject=id1 [--note=...]      send back (status review_failed) so translate-tools.ts redoes it
 *   --sample=N                     print N random unreviewed rows outside the top-scored ones (for the 10% sample)
 * Usage: bun run scripts/review-translations.ts --lang=zh --list
 */
import { config } from "dotenv";
import { createClient } from "@libsql/client";

config({ path: new URL("../.env.local", import.meta.url).pathname, quiet: true });
const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=").slice(1).join("=");
const lang = arg("lang") ?? "zh";
const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });

async function show(sql: string, args: (string | number)[]) {
  const rows = (await db.execute({ sql, args })).rows;
  for (const r of rows) {
    const src = { tagline: r.tagline, description: r.description };
    console.log(`\n=== ${r.tool_id}\nEN: ${src.tagline}\n    ${src.description}`);
    const t = JSON.parse(String(r.content));
    console.log(`${lang.toUpperCase()}: ${t.tagline}\n    ${t.description}`);
    if (t.key_differentiator) console.log(`  区别: ${t.key_differentiator}`);
    for (const k of ["capabilities", "best_for", "not_for", "limitations"]) if (t[k]?.length) console.log(`  ${k}: ${t[k].join(" | ")}`);
    if (r.issues) console.log(`  reviewer notes: ${String(r.issues).replace(/\n/g, " / ").slice(0, 400)}`);
  }
  console.log(`\n${rows.length} rows`);
}

const base = `SELECT i.tool_id, i.content, i.issues, t.tagline, t.description FROM tool_i18n i JOIN tools t ON t.id = i.tool_id
  WHERE i.lang = ? AND i.status = 'approved' AND i.human_reviewed = 0`;

if (process.argv.includes("--list")) {
  await show(`${base} ORDER BY t.score DESC LIMIT ?`, [lang, Number(arg("limit") ?? 10)]);
} else if (arg("sample")) {
  await show(`${base} ORDER BY random() LIMIT ?`, [lang, Number(arg("sample"))]);
} else if (arg("mark")) {
  const ids = arg("mark")!.split(",");
  const level = Number(arg("level") ?? 1);
  const r = await db.execute({ sql: `UPDATE tool_i18n SET human_reviewed = ? WHERE lang = ? AND status = 'approved' AND tool_id IN (${ids.map(() => "?").join(",")})`, args: [level, lang, ...ids] });
  console.log(`published ${r.rowsAffected} (level ${level})`);
} else if (arg("reject")) {
  const ids = arg("reject")!.split(",");
  const r = await db.execute({ sql: `UPDATE tool_i18n SET status = 'review_failed', source_hash = '', issues = ? WHERE lang = ? AND tool_id IN (${ids.map(() => "?").join(",")})`, args: [`owner: ${arg("note") ?? "rejected"}`, lang, ...ids] });
  console.log(`rejected ${r.rowsAffected}`);
} else {
  console.log("use --list, --sample=N, --mark=ids or --reject=ids");
}
