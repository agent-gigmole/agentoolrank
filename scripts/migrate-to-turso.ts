#!/usr/bin/env bun
/**
 * Migrate local SQLite data to Turso remote database.
 * Usage: TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... bun run scripts/migrate-to-turso.ts
 */
import { createClient } from "@libsql/client";
import { join } from "path";

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_URL || !TURSO_TOKEN) {
  console.error("Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN");
  process.exit(1);
}

const local = createClient({ url: `file:${join(process.cwd(), "db", "local.db")}` });
const remote = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

async function migrateTable(table: string, batchSize = 50) {
  const countResult = await local.execute(`SELECT COUNT(*) as c FROM ${table}`);
  const total = countResult.rows[0].c as number;
  console.log(`\n${table}: ${total} rows`);

  if (total === 0) return;

  // Get column names
  const pragma = await local.execute(`PRAGMA table_info(${table})`);
  const columns = pragma.rows.map((r: any) => r.name as string);

  let offset = 0;
  let migrated = 0;

  while (offset < total) {
    const rows = await local.execute({
      sql: `SELECT * FROM ${table} LIMIT ? OFFSET ?`,
      args: [batchSize, offset],
    });

    for (const row of rows.rows) {
      const values = columns.map((col) => (row as any)[col]);
      const placeholders = columns.map(() => "?").join(", ");
      const colNames = columns.join(", ");

      try {
        await remote.execute({
          sql: `INSERT OR REPLACE INTO ${table} (${colNames}) VALUES (${placeholders})`,
          args: values,
        });
        migrated++;
      } catch (err: any) {
        console.error(`  Error inserting into ${table}: ${err.message}`);
      }
    }

    offset += batchSize;
    process.stdout.write(`  ${migrated}/${total}\r`);
  }

  console.log(`  ${migrated}/${total} migrated`);
}

async function main() {
  console.log("Migrating to Turso:", TURSO_URL);

  // Migrate in order (respecting foreign keys)
  await migrateTable("categories");
  await migrateTable("tools");
  await migrateTable("metric_snapshots");
  await migrateTable("stacks");
  await migrateTable("subscribers");

  // Verify
  console.log("\n--- Verification ---");
  for (const table of ["categories", "tools", "metric_snapshots", "stacks", "subscribers"]) {
    const localCount = await local.execute(`SELECT COUNT(*) as c FROM ${table}`);
    const remoteCount = await remote.execute(`SELECT COUNT(*) as c FROM ${table}`);
    const l = localCount.rows[0].c;
    const r = remoteCount.rows[0].c;
    const match = l === r ? "✓" : "✗ MISMATCH";
    console.log(`  ${table}: local=${l} remote=${r} ${match}`);
  }
}

main().catch(console.error);
