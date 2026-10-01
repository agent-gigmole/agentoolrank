/**
 * Remove reviewer meta-notes ("Website content could not be fetched...") from stored tool intelligence lists.
 * Writes a rollback file first. Usage: bun run scripts/clean-meta-notes.ts [--dry-run]
 */
import { config } from "dotenv";
import { createClient } from "@libsql/client";
import { writeFileSync } from "node:fs";
import { stripMetaNotes } from "../src/lib/review";

config({ path: new URL("../.env.local", import.meta.url).pathname, quiet: true });
const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });
const rows = (await db.execute("SELECT id, intelligence FROM tools WHERE intelligence != ''")).rows as unknown as Array<{ id: string; intelligence: string }>;
const changed: Array<{ id: string; old: string; next: string }> = [];
for (const r of rows) {
  let intel: Record<string, unknown>;
  try { intel = JSON.parse(r.intelligence); } catch { continue; }
  const next = JSON.stringify(stripMetaNotes(intel));
  if (next !== JSON.stringify(intel)) changed.push({ id: r.id, old: r.intelligence, next });
}
console.log(`changed: ${changed.length} (${changed.map((c) => c.id).join(", ")})`);
if (process.argv.includes("--dry-run") || changed.length === 0) process.exit(0);
const backup = new URL(`../data/intelligence-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`, import.meta.url).pathname;
writeFileSync(backup, JSON.stringify(Object.fromEntries(changed.map((c) => [c.id, c.old])), null, 2));
await db.batch(changed.map((c) => ({ sql: "UPDATE tools SET intelligence = ? WHERE id = ?", args: [c.next, c.id] })), "write");
console.log(`updated; rollback: ${backup}`);
