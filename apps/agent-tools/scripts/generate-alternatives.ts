/**
 * Fill tools.alternatives: TF-IDF shortlist (30) → LLM picks up to 8 real alternatives.
 * Usage: bun run scripts/generate-alternatives.ts [--all] [--limit=N] [--dry-run]
 *   default: only tools whose alternatives are empty. Budget guard: stops at MAX_USD.
 */
import { config } from "dotenv";
import { createClient } from "@libsql/client";
import { rankCandidates, parseAlternativesResponse } from "../src/lib/alternatives";
import { llm, llmStats } from "./llm";

config({ path: new URL("../.env.local", import.meta.url).pathname });

const MODEL = "deepseek/deepseek-v3.2";
const PRICE_IN = 0.28 / 1e6, PRICE_OUT = 0.42 / 1e6; // USD per token (OpenRouter, 2026-10-01)
const MAX_USD = 0.6;
const SHORTLIST = 30, CONCURRENCY = 6;

const args = process.argv.slice(2);
const all = args.includes("--all"), dryRun = args.includes("--dry-run");
const limit = Number(args.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? Infinity);

const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });

interface Row { id: string; name: string; tagline: string; description: string; category_tags: string; alternatives: string; intelligence: string }

function intel(row: Row): { capabilities?: string[]; key_differentiator?: string; best_for?: string[] } {
  try { return JSON.parse(row.intelligence || "{}"); } catch { return {}; }
}

function docText(row: Row): string {
  const i = intel(row);
  return [row.name, row.tagline, row.description, row.category_tags, ...(i.capabilities ?? []), i.key_differentiator ?? "", ...(i.best_for ?? [])].join(" ");
}

function summary(row: Row): string {
  const i = intel(row);
  return `${row.id}: ${row.name} — ${row.tagline}${i.key_differentiator ? ` | ${i.key_differentiator}` : ""}`.slice(0, 260);
}

let spent = 0;

async function pick(target: Row, candidates: Row[]): Promise<string[]> {
  const prompt = `You maintain a directory of open-source AI agent tools.

Target tool:
${summary(target)}
Capabilities: ${(intel(target).capabilities ?? []).join("; ").slice(0, 600)}

Candidates (id: name — tagline | differentiator):
${candidates.map(summary).join("\n")}

Pick the candidates a developer would realistically evaluate INSTEAD of the target — tools that do the same primary job. Exclude tools that are merely complementary (e.g. a vector DB is not an alternative to an agent framework). Order from closest to least close. Pick at most 8; pick fewer (even 0) if few are real alternatives.

Reply with JSON only: {"alternatives": ["candidate-id", ...]}`;

  const text = await llm(prompt, { maxTokens: 300, temperature: 0.2 });
  spent = llmStats.openrouterUsd;
  return parseAlternativesResponse(text, new Set(candidates.map((c) => c.id)), target.id);
}

async function main() {
  const rows = (await db.execute("SELECT id, name, tagline, description, category_tags, alternatives, intelligence FROM tools ORDER BY score DESC")).rows as unknown as Row[];
  const byId = new Map(rows.map((r) => [r.id, r]));
  const docs = rows.map((r) => ({ id: r.id, text: docText(r) }));
  const todo = rows.filter((r) => all || !r.alternatives || r.alternatives === "[]").slice(0, limit);
  console.log(`tools=${rows.length} todo=${todo.length} model=${MODEL} dryRun=${dryRun}`);

  let done = 0, empty = 0, failed = 0;
  const queue = [...todo];
  async function worker() {
    while (queue.length) {
      if (spent >= MAX_USD) { console.log(`budget reached ($${spent.toFixed(3)}), stopping`); queue.length = 0; return; }
      const row = queue.shift()!;
      try {
        const candidates = rankCandidates(row.id, docs, SHORTLIST).map((id) => byId.get(id)!);
        const alts = await pick(row, candidates);
        if (alts.length === 0) empty++;
        if (dryRun) console.log(`${row.id} → ${alts.join(", ")}`);
        else await db.execute({ sql: "UPDATE tools SET alternatives = ? WHERE id = ?", args: [JSON.stringify(alts), row.id] });
        done++;
        if (done % 25 === 0) console.log(`progress ${done}/${todo.length} spent=$${spent.toFixed(3)}`);
      } catch (e) {
        failed++;
        console.error(`FAIL ${row.id}: ${(e as Error).message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`done=${done} empty=${empty} failed=${failed} spent=$${spent.toFixed(3)}`);
}

main();
