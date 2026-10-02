/**
 * Keep only the English part of bilingual taglines ("English … 中文…") stored from GitHub descriptions.
 * Writes a rollback file first. Usage: bun run scripts/clean-bilingual-taglines.ts [--dry-run]
 */
import { config } from "dotenv";
import { createClient } from "@libsql/client";
import { writeFileSync } from "node:fs";
import { englishOnlyTagline } from "../src/lib/review";

config({ path: new URL("../.env.local", import.meta.url).pathname, quiet: true });
const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });
const rows = (await db.execute("SELECT id, tagline FROM tools")).rows as unknown as Array<{ id: string; tagline: string }>;
const changed = rows.map((r) => ({ ...r, next: englishOnlyTagline(r.tagline) })).filter((r) => r.next !== r.tagline);
for (const c of changed) console.log(`${c.id}\n  - ${c.tagline}\n  + ${c.next}`);
console.log(`changed: ${changed.length}`);
if (process.argv.includes("--dry-run") || !changed.length) process.exit(0);
const f = new URL(`../data/bilingual-tagline-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`, import.meta.url).pathname;
writeFileSync(f, JSON.stringify(Object.fromEntries(changed.map((c) => [c.id, c.tagline])), null, 2));
await db.batch(changed.map((c) => ({ sql: "UPDATE tools SET tagline = ? WHERE id = ?", args: [c.next, c.id] })), "write");
console.log(`updated; rollback: ${f}`);
