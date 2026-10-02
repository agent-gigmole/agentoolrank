/**
 * Regenerate a listed tool's description + intelligence from its own README/website (judge.ts), e.g. when the
 * stored intelligence describes a different project with the same name. Writes a rollback file first.
 * Usage: bun run scripts/rejudge-tools.ts --only=omniroute [--dry-run] [--category]
 *   --category also replaces category_tags with the judge's category (for miscategorized tools).
 */
import { config } from "dotenv";
import { createClient } from "@libsql/client";
import { writeFileSync } from "node:fs";
import { fetchText, readme, judge } from "./judge";
import { stripMetaNotes } from "../src/lib/review";

config({ path: new URL("../.env.local", import.meta.url).pathname, quiet: true });
const only = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1]?.split(",") ?? [];
const dryRun = process.argv.includes("--dry-run");
const withCategory = process.argv.includes("--category");
const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });
const categories = (await db.execute("SELECT slug, name FROM categories")).rows as unknown as Array<{ slug: string; name: string }>;
const backup: Record<string, unknown> = {};

for (const id of only) {
  const t = (await db.execute({ sql: "SELECT id, name, tagline, description, intelligence, website_url, github_url, category_tags FROM tools WHERE id = ?", args: [id] })).rows[0] as unknown as
    { id: string; name: string; tagline: string; description: string; intelligence: string; website_url: string; github_url: string | null; category_tags: string } | undefined;
  if (!t) { console.log(`missing ${id}`); continue; }
  const [site, rd] = await Promise.all([fetchText(t.website_url), readme(t.github_url)]);
  const v = await judge(t.name, t.website_url, t.tagline, site.text, rd, categories);
  if (!v || v.decision !== "approve") { console.log(`${id}: judge did not approve (${v?.reason ?? "no verdict"}); left unchanged`); continue; }
  const intel = JSON.stringify(stripMetaNotes(v.intelligence));
  const cats = withCategory ? JSON.stringify([v.category]) : t.category_tags;
  console.log(`${id}\n  category: ${t.category_tags} -> ${cats}\n  description: ${v.description}\n  intelligence: ${intel.slice(0, 400)}`);
  backup[id] = { description: t.description, intelligence: t.intelligence, category_tags: t.category_tags };
  if (!dryRun) await db.execute({ sql: "UPDATE tools SET description = ?, intelligence = ?, category_tags = ? WHERE id = ?", args: [v.description, intel, cats, id] });
}
if (!dryRun && Object.keys(backup).length) {
  const f = new URL(`../data/rejudge-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`, import.meta.url).pathname;
  writeFileSync(f, JSON.stringify(backup, null, 2));
  console.log(`rollback: ${f}`);
}
