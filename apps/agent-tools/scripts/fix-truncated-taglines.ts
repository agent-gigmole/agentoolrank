/**
 * Rewrite taglines that older crawls cut off mid-word (isTruncatedTagline) into one complete sentence ≤120 chars,
 * using only the tool's stored description + README head as evidence. Writes a rollback file first.
 * Usage: bun run scripts/fix-truncated-taglines.ts [--dry-run]
 */
import { config } from "dotenv";
import { createClient } from "@libsql/client";
import { writeFileSync } from "node:fs";
import { isTruncatedTagline } from "../src/lib/review";
import { readme } from "./judge";
import { llm } from "./llm";

config({ path: new URL("../.env.local", import.meta.url).pathname, quiet: true });
const dryRun = process.argv.includes("--dry-run");
const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });

const rows = ((await db.execute("SELECT id, name, tagline, description, github_url FROM tools")).rows as unknown as Array<{ id: string; name: string; tagline: string; description: string; github_url: string | null }>)
  .filter((r) => isTruncatedTagline(r.tagline));
console.log(`truncated: ${rows.length}`);

const updates: Array<{ id: string; old: string; tagline: string }> = [];
for (let i = 0; i < rows.length; i += 4) {
  await Promise.all(rows.slice(i, i + 4).map(async (r) => {
    const rd = (await readme(r.github_url)).slice(0, 1500);
    const prompt = `Write the directory tagline for the open-source project "${r.name}": one complete English sentence or phrase, at most 110 characters, factual, no hype words, no trailing period needed. Use ONLY the evidence below; do not invent features or numbers.

Cut-off tagline: ${r.tagline}
Description: ${r.description.slice(0, 800)}
README start: ${rd || "(none)"}

Reply with the tagline only.`;
    const t = (await llm(prompt, { maxTokens: 100, temperature: 0.2 })).trim().replace(/^["']|["']$/g, "");
    if (t.length < 10 || t.length > 120 || isTruncatedTagline(t)) { console.log(`skip ${r.id}: "${t}"`); return; }
    updates.push({ id: r.id, old: r.tagline, tagline: t });
    console.log(`${r.id}\n   - ${r.tagline.slice(-60)}\n   + ${t}`);
  }));
}
if (dryRun || updates.length === 0) process.exit(0);
const backup = new URL(`../data/tagline-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`, import.meta.url).pathname;
writeFileSync(backup, JSON.stringify(Object.fromEntries(updates.map((u) => [u.id, u.old])), null, 2));
await db.batch(updates.map((u) => ({ sql: "UPDATE tools SET tagline = ? WHERE id = ?", args: [u.tagline, u.id] })), "write");
console.log(`updated ${updates.length}; rollback: ${backup}`);
