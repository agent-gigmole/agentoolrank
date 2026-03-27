#!/usr/bin/env bun
/**
 * Clean up the tools database after bulk crawl:
 * 1. Remove non-tool repos (awesome-lists, models, tutorials, datasets)
 * 2. Remove fake/spam repos
 * 3. Remove duplicate slugs (keep higher-star version)
 * 4. Filter out repos below star threshold
 * 5. Update category counts
 *
 * Usage: bun run scripts/cleanup-tools.ts [--dry-run]
 */
import { db } from "../src/lib/db";

const DRY_RUN = process.argv.includes("--dry-run");
const MIN_STARS = 200; // Minimum stars to keep

// Patterns that indicate a repo is NOT a usable tool
const NON_TOOL_PATTERNS = [
  /^awesome-/,           // awesome-lists (curated lists, not tools)
  /^llms?-from/,         // tutorials
  /-paper[s]?$/,         // paper repos
  /-guide$/,             // guides
  /-cookbook$/,           // cookbooks
  /-tutorial[s]?$/,      // tutorials
  /-example[s]?$/,       // examples
  /-benchmark[s]?$/,     // benchmarks (unless it's a tool)
  /^system-prompts/,     // prompt collections
  /^prompt-engineering/,  // guides
];

// Explicit blocklist of repos to remove (not AI agent tools)
const BLOCKLIST = new Set([
  "openclaw",
  "clawdbot",
  "awesome-chatgpt-prompts",
  "llms-from-scratch",
  "deepseek-v3",
  "deepseek-r1",
  "stable-diffusion-webui",  // image gen, not agent
  "gfpgan",                  // image restoration
  "videocrafter",            // video gen
  "cogvideo",                // video gen
  "dain",                    // video interpolation
  "musiclm-pytorch",         // music gen
  "llava",                   // VLM model, not tool
  "cogvlm",                  // VLM model
  "pixel-character-generator", // image gen
  "video-killed-the-radio-star", // art project
  "openai-cookbook",          // tutorials
  "prompt-engineering-guide", // guide
  "gpt4all",                 // model runtime (borderline, keep ollama instead)
  "latent-diffusion",        // model
  "stable-diffusion",        // model
  "tortoise-tts",            // TTS model
  "bark",                    // TTS model
  "whisper",                 // ASR model (not agent tool)
  "whisper-cpp",             // ASR runtime
  "tts",                     // TTS model
  "examples",                // generic examples
  "charts",                  // helm charts
]);

// Repos that are tools/models (not agent tools), keep only if high relevance
const MAYBE_RELEVANT = new Set([
  "ollama",       // LLM runtime - relevant as infra
  "vllm",         // LLM serving - relevant as infra
  "llama-cpp",    // LLM runtime - relevant as infra
  "text-generation-inference", // serving
  "text-generation-webui",     // UI
]);

async function main() {
  console.log(`Cleanup mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}\n`);

  const allTools = await db.execute("SELECT id, name, github_owner, github_repo, github_stars FROM tools ORDER BY github_stars DESC");
  const tools = allTools.rows as Array<{
    id: string; name: string; github_owner: string | null; github_repo: string | null; github_stars: number | null;
  }>;

  console.log(`Total tools before cleanup: ${tools.length}\n`);

  const toDelete: string[] = [];
  const reasons: Map<string, string> = new Map();

  for (const tool of tools) {
    // 1. Blocklist
    if (BLOCKLIST.has(tool.id)) {
      toDelete.push(tool.id);
      reasons.set(tool.id, "blocklist");
      continue;
    }

    // 2. Non-tool patterns
    if (NON_TOOL_PATTERNS.some((p) => p.test(tool.id))) {
      toDelete.push(tool.id);
      reasons.set(tool.id, "non-tool pattern");
      continue;
    }

    // 3. Below star threshold
    if (tool.github_stars !== null && tool.github_stars < MIN_STARS) {
      toDelete.push(tool.id);
      reasons.set(tool.id, `low stars (${tool.github_stars})`);
      continue;
    }
  }

  // 4. Find and resolve duplicates (same github_owner/github_repo but different slugs)
  const byRepo = new Map<string, Array<{ id: string; stars: number }>>();
  for (const tool of tools) {
    if (!tool.github_owner || !tool.github_repo) continue;
    if (toDelete.includes(tool.id)) continue;
    const key = `${tool.github_owner}/${tool.github_repo}`.toLowerCase();
    if (!byRepo.has(key)) byRepo.set(key, []);
    byRepo.get(key)!.push({ id: tool.id, stars: tool.github_stars ?? 0 });
  }

  for (const [repo, entries] of byRepo) {
    if (entries.length > 1) {
      // Keep the one with most stars, delete the rest
      entries.sort((a, b) => b.stars - a.stars);
      for (let i = 1; i < entries.length; i++) {
        toDelete.push(entries[i].id);
        reasons.set(entries[i].id, `duplicate of ${entries[0].id} (${repo})`);
      }
    }
  }

  // Report
  console.log(`To delete: ${toDelete.length}\n`);
  const byReason = new Map<string, number>();
  for (const [id, reason] of reasons) {
    const cat = reason.startsWith("low stars") ? "low stars" : reason.startsWith("duplicate") ? "duplicate" : reason;
    byReason.set(cat, (byReason.get(cat) ?? 0) + 1);
  }
  for (const [reason, count] of [...byReason].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${reason}: ${count}`);
  }

  if (!DRY_RUN) {
    // Delete in batches (metric_snapshots first due to FK constraint)
    for (let i = 0; i < toDelete.length; i += 50) {
      const batch = toDelete.slice(i, i + 50);
      const placeholders = batch.map(() => "?").join(",");
      await db.execute({ sql: `DELETE FROM metric_snapshots WHERE tool_id IN (${placeholders})`, args: batch });
      await db.execute({ sql: `DELETE FROM tools WHERE id IN (${placeholders})`, args: batch });
    }

    // Update category counts
    await db.execute(`
      UPDATE categories SET tool_count = (
        SELECT COUNT(*) FROM tools WHERE category_tags LIKE '%"' || categories.slug || '"%'
      )
    `);

    const remaining = await db.execute("SELECT COUNT(*) as c FROM tools");
    console.log(`\nRemaining tools: ${remaining.rows[0].c}`);

    // Show category distribution
    const cats = await db.execute("SELECT slug, tool_count FROM categories ORDER BY tool_count DESC");
    console.log("\nCategory distribution:");
    for (const r of cats.rows as any[]) {
      console.log(`  ${String(r.slug).padEnd(30)} ${r.tool_count}`);
    }
  } else {
    console.log("\nDry run - no changes made. Run without --dry-run to apply.");
    // Show some examples
    console.log("\nSample deletions:");
    for (const id of toDelete.slice(0, 20)) {
      const tool = tools.find((t) => t.id === id);
      console.log(`  ${id.padEnd(35)} ★${String(tool?.github_stars ?? 0).padStart(7)}  reason: ${reasons.get(id)}`);
    }
  }
}

main().catch(console.error);
