#!/usr/bin/env bun
/**
 * Filter out tools that are NOT relevant to AI agent directory.
 * Uses tagline + name analysis to detect non-agent tools.
 *
 * Usage: bun run scripts/filter-relevance.ts [--dry-run]
 */
import { db } from "../src/lib/db";

const DRY_RUN = process.argv.includes("--dry-run");

// Positive signals: tool IS relevant to AI agents
const RELEVANT_PATTERNS = [
  /\bagent/i,
  /\bllm\b/i,
  /\blarge language model/i,
  /\bchat(bot|gpt)?/i,
  /\bai\s*(assistant|tool|platform|framework|sdk|workflow|pipeline)/i,
  /\bautonomous/i,
  /\borchestrat/i,
  /\bprompt/i,
  /\brag\b/i,
  /\bretrieval/i,
  /\bvector/i,
  /\bembedding/i,
  /\bmemory/i,
  /\btool[\s-]?(call|use|integration)/i,
  /\bfunction[\s-]?call/i,
  /\bmcp\b/i,
  /\bmodel[\s-]?context/i,
  /\bcode[\s-]?(gen|completion|assistant|review|interpret)/i,
  /\bcoding[\s-]?agent/i,
  /\bcopilot/i,
  /\bweb[\s-]?(scraping|crawl|agent)/i,
  /\bbrowser[\s-]?(agent|automat)/i,
  /\bvoice[\s-]?agent/i,
  /\bspeech/i,
  /\btext[\s-]?to[\s-]?speech/i,
  /\bobserv/i,
  /\beval(uat)?/i,
  /\bmonitor/i,
  /\btrac(e|ing)/i,
  /\bfine[\s-]?tun/i,
  /\binference/i,
  /\bserving/i,
  /\bno[\s-]?code/i,
  /\blow[\s-]?code/i,
  /\bworkflow/i,
  /\bsandbox/i,
  /\bknowledge/i,
  /\bdocument[\s-]?(ai|process|extract|pars)/i,
  /\bmarkdown.*llm/i,
  /\bgen[\s-]?ai/i,
  /\bgenerative/i,
  /\bai[\s-]?native/i,
  /\bnlp\b/i,
  /\bnatural language/i,
  /\bsemantic/i,
  /\btransformer/i,
  /\bgpt/i,
  /\bclaude/i,
  /\bopenai/i,
  /\banthrop/i,
  /\bgemini/i,
  /\bllama/i,
  /\bmistral/i,
  /\bdeepseek/i,
  /\bhugging[\s-]?face/i,
  /\blangchain/i,
  /\blanggraph/i,
  /\bcrew[\s-]?ai/i,
  /\bdify/i,
  /\bn8n/i,
  /\bflowise/i,
  // Known AI tools that may have vague taglines
  /\bauto[\s-]?gpt/i,
  /\bopen[\s-]?hands/i,
  /\bopen[\s-]?devin/i,
  /\bbabyagi/i,
  /\bmetagpt/i,
  /\bdevika/i,
  /\bgpt[\s-]?(pilot|engineer|researcher)/i,
  /\bcursor/i,
  /\baider/i,
  /\btabby/i,
  /\bcody/i,
  /\bcontinue/i,
  /\bsweep/i,
  /\bchroma/i,
  /\bqdrant/i,
  /\bweaviate/i,
  /\bmilvus/i,
  /\bpgvector/i,
  /\bfaiss/i,
  /\bjina/i,
  /\btxtai/i,
  /\blangfuse/i,
  /\bragas/i,
  /\bdeepeval/i,
  /\bpromptfoo/i,
  /\bcomposio/i,
  /\be2b/i,
  /\bskyvern/i,
  /\bfirecrawl/i,
  /\bcrawl4ai/i,
  /\bscrapegraph/i,
  /\bvapi/i,
  /\bllama[\s-]?(index|cpp)/i,
  /\bollama/i,
  /\bvllm/i,
  /\bben[\s-]?to[\s-]?ml/i,
  /\bray\b.*\b(ai|compute|distributed)/i,
  /\bcolossalai/i,
  /\bmarkitdown/i,
  /\bpydantic[\s-]?ai/i,
  /\bopen[\s-]?interpreter/i,
  /\bprivate[\s-]?gpt/i,
  /\bgpt4all/i,
  /\bscreenshot[\s-]?to[\s-]?code/i,
  /\bjan\b.*\b(ai|gpt|llm|chat)/i,
  /\bcherry[\s-]?studio/i,
  /\bany[\s-]?thing[\s-]?llm/i,
  /\btemporal/i,
  /\bprefect/i,
  /\bwindmill/i,
  /\bunstructured/i,
  /\bdocling/i,
  /\bmineru/i,
  /\bguardrail/i,
  /\bnemo/i,
  /\bguidance/i,
  /\boutlines/i,
  /\binstructor/i,
  /\btypechat/i,
  /\bpeft\b/i,
  /\bunsloth/i,
  /\baxolotl/i,
  /\bopen[\s-]?llm/i,
  /\bfast[\s-]?chat/i,
];

// Known-good tool IDs that should never be removed
const WHITELIST = new Set([
  "auto-gpt", "autogpt", "openhands", "opendevin", "llama-index", "gpt-index",
  "aider", "ray", "colossalai", "tabby", "cursor", "continue", "chroma",
  "babyagi", "jina", "markitdown", "screenshot-to-code", "grok-1", "jan",
  "pydantic", "temporal", "open-interpreter", "private-gpt", "scrapegraph-ai",
  "open-notebook", "cherry-studio", "chainlit", "pipecat", "self-operating-computer",
  "ai-scientist", "bloop", "openchatkit", "insanely-fast-whisper",
]);

// Negative signals: tool is NOT an AI agent tool
const IRRELEVANT_PATTERNS = [
  /\bscheduling\s*(infrastructure|platform)/i,
  /\bcalendar/i,
  /\bocr\b(?!.*ai)/i,
  /\bterminal\s*emulator/i,
  /\bandroid\s*os/i,
  /\bios\s*app\b/i,
  /\bgame\s*(engine|develop)/i,
  /\bblock[\s-]?chain\b/i,
  /\bcrypto(currency)?\b/i,
  /\bweb3\b/i,
  /\bnft\b/i,
  /\be[\s-]?commerce/i,
  /\bshopify/i,
  /\bwordpress/i,
  /\bcms\b/i,
  /\bphoto\s*edit/i,
  /\bvideo\s*edit/i,
  /\bimage\s*(restor|enhanc|process)/i,
  /\bmusic\s*(gen|creat|produc)/i,
  /\b3d\s*model/i,
  /\bstable[\s-]?diffusion/i,
  /\bcomfy[\s-]?ui/i,
  /\bpainting/i,
  /\bartwork/i,
];

function isRelevant(name: string, tagline: string): { relevant: boolean; reason: string } {
  const text = `${name} ${tagline}`.toLowerCase();

  // Check for strong irrelevance signals
  for (const pattern of IRRELEVANT_PATTERNS) {
    if (pattern.test(text)) {
      return { relevant: false, reason: `matches irrelevant: ${pattern}` };
    }
  }

  // Check for relevance signals
  for (const pattern of RELEVANT_PATTERNS) {
    if (pattern.test(text)) {
      return { relevant: true, reason: `matches relevant: ${pattern}` };
    }
  }

  // No strong signal either way - mark as irrelevant (conservative)
  return { relevant: false, reason: "no AI/agent signal in name or tagline" };
}

async function main() {
  console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}\n`);

  const result = await db.execute("SELECT id, name, tagline, github_stars FROM tools ORDER BY github_stars DESC");
  const tools = result.rows as unknown as Array<{
    id: string; name: string; tagline: string; github_stars: number | null;
  }>;

  const toRemove: Array<{ id: string; name: string; stars: number; reason: string }> = [];

  for (const tool of tools) {
    if (WHITELIST.has(tool.id)) continue;
    const { relevant, reason } = isRelevant(tool.name, tool.tagline || "");
    if (!relevant) {
      toRemove.push({ id: tool.id, name: tool.name, stars: tool.github_stars ?? 0, reason });
    }
  }

  console.log(`To remove: ${toRemove.length}/${tools.length}\n`);
  console.log("Top removals by stars:");
  for (const t of toRemove.slice(0, 30)) {
    console.log(`  ★${String(t.stars).padStart(7)}  ${t.id.padEnd(35)} ${t.reason.slice(0, 50)}`);
  }

  if (!DRY_RUN) {
    for (let i = 0; i < toRemove.length; i += 50) {
      const batch = toRemove.slice(i, i + 50).map((t) => t.id);
      const placeholders = batch.map(() => "?").join(",");
      await db.execute({ sql: `DELETE FROM metric_snapshots WHERE tool_id IN (${placeholders})`, args: batch });
      await db.execute({ sql: `DELETE FROM tools WHERE id IN (${placeholders})`, args: batch });
    }

    await db.execute(`
      UPDATE categories SET tool_count = (
        SELECT COUNT(*) FROM tools WHERE category_tags LIKE '%"' || categories.slug || '"%'
      )
    `);

    const remaining = await db.execute("SELECT COUNT(*) as c FROM tools");
    console.log(`\nRemaining: ${remaining.rows[0].c}`);
  }
}

main().catch(console.error);
