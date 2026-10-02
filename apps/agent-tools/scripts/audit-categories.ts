/**
 * Category audit, read-only: re-judge every listed tool from its own README/website and write old vs new
 * categories to data/category-audit-<date>.csv for review. Changes nothing in the DB.
 * Usage: bun run scripts/audit-categories.ts [--limit=N] [--max-usd=3]
 */
import { config } from "dotenv";
import { createClient } from "@libsql/client";
import { writeFileSync, appendFileSync, existsSync, readFileSync } from "node:fs";
import { fetchText, readme, judge, spentUsd } from "./judge";

config({ path: new URL("../.env.local", import.meta.url).pathname, quiet: true });
const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=")[1];
const limit = Number(arg("limit") ?? Infinity);
const maxUsd = Number(arg("max-usd") ?? 3);
const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });
const categories = (await db.execute("SELECT slug, name FROM categories")).rows as unknown as Array<{ slug: string; name: string }>;
const tools = (await db.execute("SELECT id, name, tagline, website_url, github_url, category_tags FROM tools ORDER BY score DESC")).rows as unknown as
  Array<{ id: string; name: string; tagline: string; website_url: string; github_url: string | null; category_tags: string }>;

const out = new URL(`../data/category-audit-${new Date().toISOString().slice(0, 10)}.csv`, import.meta.url).pathname;
const q = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
const done = new Set(existsSync(out) ? readFileSync(out, "utf8").split("\n").slice(1).map((l) => l.split(",")[0].replace(/"/g, "")) : []);
if (!existsSync(out)) writeFileSync(out, "id,old,judge,in_old,decision,reason\n");

const queue = tools.filter((t) => !done.has(t.id)).slice(0, limit);
console.log(`tools=${tools.length} already=${done.size} todo=${queue.length} out=${out}`);
let n = 0;
async function worker() {
  while (queue.length && spentUsd < maxUsd) {
    const t = queue.shift()!;
    const [site, rd] = await Promise.all([fetchText(t.website_url), readme(t.github_url)]);
    const v = await judge(t.name, t.website_url, t.tagline, site.text, rd, categories);
    const old: string[] = JSON.parse(t.category_tags || "[]");
    const cat = v?.category ?? "";
    appendFileSync(out, [t.id, q(old.join("|")), cat, old.includes(cat) ? 1 : 0, v?.decision ?? "none", q((v?.reason ?? "").slice(0, 200))].join(",") + "\n");
    if (++n % 25 === 0) console.log(`progress ${n} spent=$${spentUsd.toFixed(3)}`);
  }
}
await Promise.all(Array.from({ length: 4 }, worker));
console.log(`done ${n} spent=$${spentUsd.toFixed(3)} (resume by re-running; finished ids are skipped)`);
