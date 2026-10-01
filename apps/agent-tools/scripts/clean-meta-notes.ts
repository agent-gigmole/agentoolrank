/**
 * Remove reviewer meta-notes ("Website content could not be fetched...", "Limited information available about...")
 * from stored tool fields: intelligence lists, pros / cons / use_cases, and whole sentences in description.
 * Writes a rollback file first. Usage: bun run scripts/clean-meta-notes.ts [--dry-run]
 */
import { config } from "dotenv";
import { createClient } from "@libsql/client";
import { writeFileSync } from "node:fs";
import { isMetaNote, stripMetaNotes, stripMetaSentences } from "../src/lib/review";

config({ path: new URL("../.env.local", import.meta.url).pathname, quiet: true });
const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });
type Row = { id: string; description: string; pros: string; cons: string; use_cases: string; intelligence: string };
const rows = (await db.execute("SELECT id, description, pros, cons, use_cases, intelligence FROM tools")).rows as unknown as Row[];

const cleanList = (raw: string) => {
  try {
    const v = JSON.parse(raw || "[]");
    return Array.isArray(v) ? JSON.stringify(v.filter((x) => typeof x !== "string" || !isMetaNote(x))) : raw;
  } catch { return raw; }
};
const cleanIntel = (raw: string) => {
  if (!raw) return raw;
  try { return JSON.stringify(stripMetaNotes(JSON.parse(raw))); } catch { return raw; }
};

const changed: Array<{ id: string; old: Partial<Row>; next: Partial<Row> }> = [];
for (const r of rows) {
  const next: Partial<Row> = {}, old: Partial<Row> = {};
  const set = (k: keyof Row, v: string, normalized: string) => { if (v !== normalized) { next[k] = v; old[k] = r[k]; } };
  set("description", stripMetaSentences(r.description), r.description);
  for (const k of ["pros", "cons", "use_cases"] as const) set(k, cleanList(r[k]), JSON.stringify(JSON.parse(r[k] || "[]")));
  if (r.intelligence) set("intelligence", cleanIntel(r.intelligence), JSON.stringify(JSON.parse(r.intelligence)));
  if (Object.keys(next).length) changed.push({ id: r.id, old, next });
}
for (const c of changed) console.log(`${c.id}: ${Object.keys(c.next).join(", ")}`);
console.log(`changed: ${changed.length}`);
if (process.argv.includes("--dry-run") || changed.length === 0) process.exit(0);
const backup = new URL(`../data/meta-notes-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`, import.meta.url).pathname;
writeFileSync(backup, JSON.stringify(Object.fromEntries(changed.map((c) => [c.id, c.old])), null, 2));
await db.batch(changed.flatMap((c) => Object.entries(c.next).map(([k, v]) => ({ sql: `UPDATE tools SET ${k} = ? WHERE id = ?`, args: [v as string, c.id] }))), "write");
console.log(`updated; rollback: ${backup}`);
