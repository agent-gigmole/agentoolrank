#!/usr/bin/env bun
/**
 * Reclassify tools based on improved category inference.
 * The original inferCategories was too broad, dumping 365+ tools into agent-frameworks.
 * This script re-analyzes each tool's GitHub topics + description + name to assign more accurate categories.
 *
 * Usage: bun run scripts/reclassify-tools.ts
 */
import { db } from "../src/lib/db";

// More precise category patterns (order matters - first match wins for primary)
const CATEGORY_RULES: Array<{
  slug: string;
  patterns: RegExp[];
  antiPatterns?: RegExp[];
}> = [
  {
    slug: "coding-agents",
    patterns: [
      /\b(code\s*(generation|completion|assistant|review|editor)|coding\s*agent|copilot|ide|code\s*interpreter)\b/i,
      /\b(devin|cursor|cody|continue|sweep|aider|tabby|codegen|refactor)\b/i,
      /\b(swe[\s-]?agent|code[\s-]?pilot|auto[\s-]?code)\b/i,
    ],
  },
  {
    slug: "browser-web-agents",
    patterns: [
      /\b(browser\s*(agent|automation|use)|web\s*(agent|scraping|crawl)|headless|playwright|selenium|puppeteer)\b/i,
      /\b(crawl4ai|firecrawl|skyvern|lavague|browser[\s-]?use|webvoyager)\b/i,
    ],
  },
  {
    slug: "voice-agents",
    patterns: [
      /\b(voice|speech|tts|stt|telephony|phone|call\s*center|asr|whisper|text[\s-]?to[\s-]?speech)\b/i,
      /\b(vapi|retell|bland|livekit)\b/i,
    ],
  },
  {
    slug: "sandboxes-execution",
    patterns: [
      /\b(sandbox|isolated\s*execution|container\s*runtime|code\s*execution|e2b|daytona)\b/i,
    ],
  },
  {
    slug: "agent-protocols",
    patterns: [
      /\b(protocol|standard|specification|interop|a2a|mcp|model[\s-]?context[\s-]?protocol)\b/i,
      /\b(agent[\s-]?protocol|openapi|jsonrpc)\b/i,
    ],
    antiPatterns: [/sdk|client|server|implementation/i], // SDKs are tool-integration
  },
  {
    slug: "no-code-agent-builders",
    patterns: [
      /\b(no[\s-]?code|low[\s-]?code|visual\s*(builder|editor)|drag[\s-]?drop|workflow\s*builder|gui\s*builder)\b/i,
      /\b(dify|flowise|n8n|langflow|activepieces|windmill)\b/i,
    ],
  },
  {
    slug: "observability-evaluation",
    patterns: [
      /\b(observ|monitor|trac(e|ing)|eval(uation)?|benchmark|test(ing)?[\s-]?framework|quality|metric)\b/i,
      /\b(langfuse|langsmith|phoenix|openllmetry|deepeval|ragas|promptfoo|braintrust|uptrain|whylabs)\b/i,
    ],
  },
  {
    slug: "memory-knowledge",
    patterns: [
      /\b(vector\s*(db|database|store)|embedding|rag\b|retriev|knowledge\s*(base|graph)|memory|semantic\s*search)\b/i,
      /\b(chroma|pinecone|qdrant|weaviate|milvus|pgvector|mem0|letta|txtai|faiss)\b/i,
    ],
  },
  {
    slug: "tool-integration",
    patterns: [
      /\b(tool[\s-]?(use|calling|integration)|api[\s-]?integration|connector|mcp[\s-]?(server|client|sdk)|function[\s-]?calling)\b/i,
      /\b(composio|arcade|zapier)\b/i,
    ],
  },
  {
    slug: "enterprise-agent-platforms",
    patterns: [
      /\b(enterprise|salesforce|microsoft[\s-]?copilot|copilot[\s-]?studio|platform)\b/i,
      /\b(semantic[\s-]?kernel|multi[\s-]?agent[\s-]?orchestrat)\b/i,
    ],
  },
  {
    slug: "agent-frameworks",
    patterns: [
      /\b(agent\s*(framework|library|sdk|toolkit)|multi[\s-]?agent|langchain|langgraph|crewai|autogen)\b/i,
      /\b(autonomous\s*agent|llm\s*(framework|agent)|orchestrat|agentic)\b/i,
    ],
  },
];

// LLM infrastructure tools - assign to relevant category or keep current
const INFRA_KEYWORDS = /\b(llm[\s-]?(serving|runtime|inference|gateway|deploy|fine[\s-]?tun)|model[\s-]?serving|tensor|gpu|quantiz)\b/i;

function classifyTool(name: string, tagline: string, topics: string[]): string[] {
  const text = [name, tagline, ...topics].join(" ").toLowerCase();
  const categories: string[] = [];
  const seen = new Set<string>();

  for (const rule of CATEGORY_RULES) {
    if (rule.antiPatterns?.some((p) => p.test(text))) continue;
    if (rule.patterns.some((p) => p.test(text))) {
      if (!seen.has(rule.slug)) {
        seen.add(rule.slug);
        categories.push(rule.slug);
      }
    }
  }

  // If nothing matched but it's LLM infra, put in agent-frameworks as closest
  if (categories.length === 0 && INFRA_KEYWORDS.test(text)) {
    categories.push("agent-frameworks");
  }

  // Default: agent-frameworks (but this should happen less now)
  return categories.length > 0 ? categories : ["agent-frameworks"];
}

async function main() {
  const result = await db.execute(
    "SELECT id, name, tagline, category_tags FROM tools"
  );
  const tools = result.rows as unknown as Array<{
    id: string;
    name: string;
    tagline: string;
    category_tags: string;
  }>;

  console.log(`Reclassifying ${tools.length} tools...\n`);

  let changed = 0;
  const categoryCounts = new Map<string, number>();

  for (const tool of tools) {
    let topics: string[] = [];
    try {
      topics = JSON.parse(tool.category_tags);
    } catch {}

    const newCats = classifyTool(tool.name, tool.tagline, topics);
    const newCatsJson = JSON.stringify(newCats);

    // Count
    for (const cat of newCats) {
      categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
    }

    // Only update if changed
    if (newCatsJson !== tool.category_tags) {
      await db.execute({
        sql: "UPDATE tools SET category_tags = ? WHERE id = ?",
        args: [newCatsJson, tool.id],
      });
      changed++;
    }
  }

  // Update category counts
  await db.execute(`
    UPDATE categories SET tool_count = (
      SELECT COUNT(*) FROM tools WHERE category_tags LIKE '%"' || categories.slug || '"%'
    )
  `);

  console.log(`Changed: ${changed}/${tools.length}\n`);
  console.log("New distribution:");
  const cats = await db.execute("SELECT slug, tool_count FROM categories ORDER BY tool_count DESC");
  for (const r of cats.rows as any[]) {
    console.log(`  ${String(r.slug).padEnd(30)} ${r.tool_count}`);
  }
}

main().catch(console.error);
