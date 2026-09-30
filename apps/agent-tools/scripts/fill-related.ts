/**
 * Fill tools.related_tools from integration mentions (both directions), excluding alternatives.
 * Usage: bun run scripts/fill-related.ts [--dry-run]
 */
import { config } from "dotenv";
import { createClient } from "@libsql/client";
import { buildRelated } from "../src/lib/related";

config({ path: new URL("../.env.local", import.meta.url).pathname });
const dryRun = process.argv.includes("--dry-run");
const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });

const parse = <T>(s: string, d: T): T => { try { return JSON.parse(s) ?? d; } catch { return d; } };

const rows = ((await db.execute("SELECT id, name, alternatives, intelligence FROM tools")).rows as unknown as Array<{ id: string; name: string; alternatives: string; intelligence: string }>)
  .map((r) => ({ id: r.id, name: r.name, alternatives: parse<string[]>(r.alternatives, []), integrations: parse<{ integrations?: string[] }>(r.intelligence, {}).integrations ?? [] }));
const related = buildRelated(rows, 8);
const nonEmpty = [...related].filter(([, v]) => v.length > 0).length;
console.log(`tools with related: ${nonEmpty}/${rows.length}`);
if (!dryRun) {
  await db.batch([...related].map(([id, v]) => ({ sql: "UPDATE tools SET related_tools = ? WHERE id = ?", args: [JSON.stringify(v), id] })), "write");
  console.log("written");
}
