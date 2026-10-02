/**
 * Apply data/category-audit-<date>.csv: in-scope tools get the judge's primary category (old value kept in
 * category_tags_old for rollback). Delisting is separate (delist-tool.ts), driven by --delist-list.
 * Usage: bun run scripts/apply-category-audit.ts --csv=data/category-audit-2026-10-02.csv [--apply]
 *        rollback: UPDATE tools SET category_tags = category_tags_old WHERE category_tags_old IS NOT NULL
 */
import { config } from "dotenv";
import { createClient } from "@libsql/client";
import { readFileSync } from "node:fs";

config({ path: new URL("../.env.local", import.meta.url).pathname, quiet: true });
const csv = process.argv.find((a) => a.startsWith("--csv="))?.slice(6);
const apply = process.argv.includes("--apply");
if (!csv) throw new Error("--csv required");
const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });
const slugs = new Set((await db.execute("SELECT slug FROM categories")).rows.map((r) => String(r.slug)));

const rows = readFileSync(new URL(`../${csv}`, import.meta.url), "utf8").trim().split("\n").slice(1)
  .map((l) => l.match(/^([^,]+),"([^"]*)",([^,]*),(\d),(\w+),/))
  .filter((m): m is RegExpMatchArray => !!m)
  .map((m) => ({ id: m[1], judge: m[3], decision: m[5] }))
  .filter((r) => r.decision === "approve" && slugs.has(r.judge));

const cols = (await db.execute("PRAGMA table_info(tools)")).rows.map((r) => String(r.name));
if (!cols.includes("category_tags_old")) {
  console.log("add column category_tags_old");
  if (apply) await db.execute("ALTER TABLE tools ADD COLUMN category_tags_old TEXT");
}
const before = new Map((await db.execute("SELECT id, category_tags FROM tools")).rows.map((r) => [String(r.id), String(r.category_tags)]));
const changes = rows.filter((r) => before.has(r.id) && before.get(r.id) !== JSON.stringify([r.judge]));
const count = (m: Map<string, string>) => { const c: Record<string, number> = {}; for (const v of m.values()) for (const s of JSON.parse(v || "[]")) c[s] = (c[s] ?? 0) + 1; return c; };
const after = new Map(before); for (const r of changes) after.set(r.id, JSON.stringify([r.judge]));
console.log(`in-scope rows=${rows.length} changes=${changes.length} apply=${apply}`);
const [b, a] = [count(before), count(after)];
for (const s of slugs) console.log(`  ${s.padEnd(28)} ${String(b[s] ?? 0).padStart(4)} -> ${a[s] ?? 0}`);
if (Object.values(a).some((n) => n === 0) || [...slugs].some((s) => !a[s])) throw new Error("a category would be empty (its page would 404) — aborting");
if (!apply) process.exit(0);
const stmts = changes.map((r) => ({
  sql: "UPDATE tools SET category_tags_old = COALESCE(category_tags_old, category_tags), category_tags = ? WHERE id = ?",
  args: [JSON.stringify([r.judge]), r.id],
}));
for (let i = 0; i < stmts.length; i += 100) await db.batch(stmts.slice(i, i + 100), "write");
console.log(`updated ${changes.length}`);
