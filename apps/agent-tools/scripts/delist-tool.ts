/**
 * Soft-delist: move a tool's row from `tools` to `tools_archive` (full row as JSON + reason + time), so it disappears
 * from every page, list and sitemap at once while staying recoverable. Discovery, expansion, review and /submit
 * all check tools_archive, so a delisted tool is not re-added automatically.
 * Usage: bun run scripts/delist-tool.ts <id> --reason="..." [--dry-run]
 *        bun run scripts/delist-tool.ts <id> --restore
 */
import { config } from "dotenv";
import { createClient } from "@libsql/client";

config({ path: new URL("../.env.local", import.meta.url).pathname, quiet: true });
const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });
const id = process.argv[2];
const reason = process.argv.find((a) => a.startsWith("--reason="))?.slice(9) ?? "";
const dryRun = process.argv.includes("--dry-run");
if (!id || id.startsWith("--")) throw new Error("usage: delist-tool.ts <id> --reason=... | --restore");

await db.execute(`CREATE TABLE IF NOT EXISTS tools_archive (
  id TEXT PRIMARY KEY, row_json TEXT NOT NULL, reason TEXT NOT NULL, archived_at TEXT NOT NULL DEFAULT (datetime('now')))`);

if (process.argv.includes("--restore")) {
  const a = (await db.execute({ sql: "SELECT row_json FROM tools_archive WHERE id = ?", args: [id] })).rows[0];
  if (!a) throw new Error(`${id} is not archived`);
  const row = JSON.parse(String(a.row_json)) as Record<string, unknown>;
  const cols = Object.keys(row);
  await db.batch([
    { sql: `INSERT INTO tools (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`, args: Object.values(row) as never },
    { sql: "DELETE FROM tools_archive WHERE id = ?", args: [id] },
  ], "write");
  console.log(`restored ${id}`);
} else {
  if (!reason) throw new Error("--reason is required");
  const t = (await db.execute({ sql: "SELECT * FROM tools WHERE id = ?", args: [id] })).rows[0];
  if (!t) throw new Error(`${id} not in tools`);
  const row = Object.fromEntries(Object.entries(t).filter(([k]) => !/^\d+$/.test(k)));
  console.log(`${id}: ${String(row.name)} — ${String(row.tagline).slice(0, 100)}\n  reason: ${reason}`);
  if (dryRun) process.exit(0);
  // One transaction: the archive copy exists before the row leaves `tools`.
  await db.batch([
    { sql: "INSERT INTO tools_archive (id, row_json, reason) VALUES (?, ?, ?)", args: [id, JSON.stringify(row), reason] },
    { sql: "DELETE FROM tools WHERE id = ?", args: [id] },
  ], "write");
  console.log(`archived ${id} (restore: bun run scripts/delist-tool.ts ${id} --restore)`);
}
