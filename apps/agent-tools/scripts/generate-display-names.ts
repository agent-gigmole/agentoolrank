/**
 * Replace repo-style names ("claude-code") with official product names ("Claude Code").
 * Usage: bun run scripts/generate-display-names.ts [--dry-run]
 * Writes a rollback file data/display-names-backup-<date>.json (id → old name) before updating.
 */
import { config } from "dotenv";
import { createClient } from "@libsql/client";
import { writeFileSync, mkdirSync } from "node:fs";
import { needsDisplayName, parseDisplayNames } from "../src/lib/display-names";

config({ path: new URL("../.env.local", import.meta.url).pathname });

const MODEL = "deepseek/deepseek-v3.2";
const BATCH = 25;
const dryRun = process.argv.includes("--dry-run");
const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });

interface Row { id: string; name: string; tagline: string; github_url: string | null; website_url: string; readme?: string }

/** First ~300 chars of the README (title, logo alt text) as evidence of the official name. */
async function readmeHead(githubUrl: string | null): Promise<string> {
  const m = githubUrl?.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!m) return "";
  try {
    const res = await fetch(`https://raw.githubusercontent.com/${m[1]}/${m[2]}/HEAD/README.md`);
    if (!res.ok) return "";
    const text = await res.text();
    const alts = [...text.matchAll(/alt="([^"]{2,80})"/g)].slice(0, 2).map((x) => x[1]);
    const heading = text.match(/^#\s+(.+)$/m)?.[1] ?? "";
    return [heading, ...alts].filter(Boolean).join(" / ").replace(/\s+/g, " ").slice(0, 200);
  } catch {
    return "";
  }
}

async function ask(rows: Row[]): Promise<Record<string, string>> {
  const list = rows.map((r) => `${r.id} | repo: ${r.github_url ?? "-"} | site: ${r.website_url || "-"} | ${r.tagline.slice(0, 120)} | readme: ${r.readme || "-"}`).join("\n");
  const prompt = `For each open-source project below, give its official product name exactly as the project itself writes it. The "readme" field is the README's title and logo alt text — trust it over your memory: correct capitalization, spacing and punctuation. Examples: claude-code → "Claude Code", llama-cpp → "llama.cpp", open-webui → "Open WebUI", n8n → "n8n", litellm → "LiteLLM". If unsure, title-case the repo name sensibly. Do not add words like "AI" or "Framework" that aren't part of the name.

${list}

Reply with JSON only, mapping each id (the text before the first "|") to its name: {"id": "Name", ...}`;
  const res = await fetch(`${process.env.LLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.LLM_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, messages: [{ role: "user", content: prompt }], temperature: 0, max_tokens: 1500 }),
  });
  if (!res.ok) throw new Error(`LLM ${res.status}`);
  const data = await res.json();
  return parseDisplayNames(data.choices?.[0]?.message?.content ?? "", new Set(rows.map((r) => r.id)));
}

async function main() {
  const rows = ((await db.execute("SELECT id, name, tagline, github_url, website_url FROM tools ORDER BY score DESC")).rows as unknown as Row[])
    .filter((r) => needsDisplayName(r.name));
  console.log(`to rename: ${rows.length}`);
  for (let i = 0; i < rows.length; i += 8) {
    await Promise.all(rows.slice(i, i + 8).map(async (r) => { r.readme = await readmeHead(r.github_url); }));
  }
  console.log(`readmes: ${rows.filter((r) => r.readme).length}/${rows.length}`);

  const updates: Record<string, string> = {};
  for (let i = 0; i < rows.length; i += BATCH) {
    Object.assign(updates, await ask(rows.slice(i, i + BATCH)));
    console.log(`batch ${i / BATCH + 1}: ${Object.keys(updates).length} names`);
  }
  const changed = rows.filter((r) => updates[r.id] && updates[r.id] !== r.name);
  for (const r of changed.slice(0, 40)) console.log(`  ${r.name} → ${updates[r.id]}`);
  if (dryRun) return;

  mkdirSync(new URL("../data", import.meta.url).pathname, { recursive: true });
  const backup = new URL(`../data/display-names-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`, import.meta.url).pathname;
  writeFileSync(backup, JSON.stringify(Object.fromEntries(changed.map((r) => [r.id, r.name])), null, 2));
  await db.batch(changed.map((r) => ({ sql: "UPDATE tools SET name = ? WHERE id = ?", args: [updates[r.id], r.id] })), "write");
  console.log(`updated ${changed.length}; rollback file: ${backup}`);
}

main();
