/**
 * Tool Intelligence Batch Generator
 *
 * Generates structured intelligence JSON for tools by analyzing GitHub READMEs.
 * Designed to be run by Claude Code subagents in batches.
 *
 * Three-layer safety:
 * 1. Local JSON backup (data/intelligence-backup.json) — survives DB issues
 * 2. Write verification — SELECT after UPDATE to confirm
 * 3. Progress log (data/intelligence-progress.log) — track what's done
 *
 * Usage: Called by subagents with specific tool ID ranges
 *   npx tsx scripts/generate-intelligence-batch.ts --ids=langchain,crewai,autogen
 *   npx tsx scripts/generate-intelligence-batch.ts --offset=0 --limit=20
 */

import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
import { readFileSync, writeFileSync, existsSync, appendFileSync } from "fs";

dotenv.config({ path: ".env.local" });

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const BACKUP_FILE = "data/intelligence-backup.json";
const PROGRESS_LOG = "data/intelligence-progress.log";

// Load existing backup
function loadBackup(): Record<string, any> {
  if (existsSync(BACKUP_FILE)) {
    try {
      return JSON.parse(readFileSync(BACKUP_FILE, "utf-8"));
    } catch {
      return {};
    }
  }
  return {};
}

// Save to backup (merge with existing)
function saveBackup(data: Record<string, any>) {
  const existing = loadBackup();
  const merged = { ...existing, ...data };
  writeFileSync(BACKUP_FILE, JSON.stringify(merged, null, 2));
}

// Log progress
function logProgress(toolId: string, status: "success" | "skipped" | "failed", detail: string) {
  const ts = new Date().toISOString();
  appendFileSync(PROGRESS_LOG, `${ts} | ${status.padEnd(7)} | ${toolId.padEnd(30)} | ${detail}\n`);
}

// Write to Turso + verify
async function writeAndVerify(toolId: string, intel: any): Promise<boolean> {
  const json = JSON.stringify(intel);

  // Write
  await db.execute({
    sql: "UPDATE tools SET intelligence = ?, updated_at = datetime('now') WHERE id = ?",
    args: [json, toolId],
  });

  // Verify
  const check = await db.execute({
    sql: "SELECT length(intelligence) as len FROM tools WHERE id = ?",
    args: [toolId],
  });
  const len = (check.rows[0] as any)?.len ?? 0;

  if (len < 10) {
    console.error(`  ✗ VERIFY FAILED for ${toolId}: length=${len}`);
    return false;
  }
  return true;
}

// Restore from backup to Turso
async function restoreFromBackup() {
  const backup = loadBackup();
  const ids = Object.keys(backup);
  console.log(`Restoring ${ids.length} tools from backup...`);

  let ok = 0, fail = 0;
  for (const id of ids) {
    try {
      const verified = await writeAndVerify(id, backup[id]);
      if (verified) ok++;
      else fail++;
    } catch (err) {
      console.error(`  ✗ ${id}: ${err}`);
      fail++;
    }
  }
  console.log(`Done: ${ok} restored, ${fail} failed`);
}

// Get tools needing intelligence
async function getToolsToProcess(offset: number, limit: number, ids?: string[]): Promise<Array<{ id: string; github_owner: string; github_repo: string; name: string }>> {
  if (ids && ids.length > 0) {
    const placeholders = ids.map(() => "?").join(",");
    const r = await db.execute({
      sql: `SELECT id, name, github_owner, github_repo FROM tools WHERE id IN (${placeholders}) ORDER BY score DESC`,
      args: ids,
    });
    return r.rows as any[];
  }

  const r = await db.execute({
    sql: `SELECT id, name, github_owner, github_repo FROM tools
          WHERE github_owner != '' AND github_repo != ''
          AND (intelligence IS NULL OR intelligence = '' OR length(intelligence) < 10)
          ORDER BY score DESC LIMIT ? OFFSET ?`,
    args: [limit, offset],
  });
  return r.rows as any[];
}

// Main
async function main() {
  const args = process.argv.slice(2);

  // Handle restore mode
  if (args.includes("--restore")) {
    await restoreFromBackup();
    return;
  }

  // Handle status check
  if (args.includes("--status")) {
    const r = await db.execute("SELECT count(*) as c FROM tools WHERE length(intelligence) > 10");
    const total = await db.execute("SELECT count(*) as c FROM tools");
    const backup = loadBackup();
    console.log(`Turso: ${(r.rows[0] as any).c}/${(total.rows[0] as any).c} have intelligence`);
    console.log(`Backup: ${Object.keys(backup).length} tools saved locally`);
    return;
  }

  // Parse args
  let offset = 0, limit = 20;
  let ids: string[] | undefined;

  for (const arg of args) {
    if (arg.startsWith("--offset=")) offset = parseInt(arg.split("=")[1]);
    if (arg.startsWith("--limit=")) limit = parseInt(arg.split("=")[1]);
    if (arg.startsWith("--ids=")) ids = arg.split("=")[1].split(",");
  }

  const tools = await getToolsToProcess(offset, limit, ids);
  console.log(`Processing ${tools.length} tools (offset=${offset}, limit=${limit})`);

  // Output tool list for subagent to process
  console.log("\n=== TOOLS TO PROCESS ===");
  for (const t of tools) {
    console.log(`${t.id} | ${t.name} | ${t.github_owner}/${t.github_repo}`);
  }
  console.log("========================\n");
  console.log("Subagent should:");
  console.log("1. Fetch each tool's README from GitHub");
  console.log("2. Generate intelligence JSON");
  console.log("3. Call writeIntelligence() for each tool");
}

main().catch(console.error);

// Export for subagent use
export { writeAndVerify, saveBackup, loadBackup, logProgress, db };
