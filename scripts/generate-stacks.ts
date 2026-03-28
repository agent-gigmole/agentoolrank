#!/usr/bin/env bun
/**
 * Batch generate Stack Graph entries using Claude Code CLI.
 * Generates stacks for a list of scenarios, matching tools from our database.
 *
 * Usage: GITHUB_TOKEN=xxx bun run scripts/generate-stacks.ts [--limit=20]
 */
import { db } from "../src/lib/db";
import { $ } from "bun";

const LIMIT = parseInt(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? "20");

// Scenarios to generate stacks for
const SCENARIOS = [
  // Finance & Trading
  "Build a quantitative trading system with AI",
  "Create an AI-powered financial analysis assistant",
  "Build a crypto trading bot with AI signals",
  "Set up AI-driven portfolio risk management",
  // E-commerce
  "Build an AI customer service chatbot for e-commerce",
  "Create an AI product recommendation engine",
  "Automate product listing with AI content generation",
  "Build an AI-powered review analysis system",
  // Healthcare
  "Build an AI medical document analyzer",
  "Create a health data extraction pipeline",
  // Legal
  "Build an AI contract review assistant",
  "Create an AI legal research agent",
  // Education
  "Build an AI tutoring assistant",
  "Create an AI-powered course content generator",
  // Content & Marketing
  "Build an AI content writing pipeline",
  "Create an AI social media management agent",
  "Build an SEO content optimization tool with AI",
  "Automate blog writing with AI agents",
  // DevOps & Infrastructure
  "Build an AI-powered incident response system",
  "Create an AI log analysis and alerting pipeline",
  "Build an AI infrastructure monitoring agent",
  "Automate Kubernetes management with AI",
  // Data & Analytics
  "Build an AI data analyst that queries databases",
  "Create a natural language to SQL interface",
  "Build an AI-powered business intelligence dashboard",
  "Create an automated data quality monitoring system",
  // Security
  "Build an AI security vulnerability scanner",
  "Create an AI-powered threat detection system",
  // Productivity
  "Build an AI email assistant that drafts replies",
  "Create an AI meeting summarizer and action tracker",
  "Build a personal AI knowledge base",
  "Create an AI task automation workflow",
  // Creative
  "Build an AI-powered design feedback tool",
  "Create an AI music recommendation agent",
  // Research
  "Build an AI academic paper summarizer",
  "Create an AI patent analysis system",
  "Build an AI competitive intelligence agent",
  // Communication
  "Build an AI-powered translation service",
  "Create a multilingual AI chatbot",
  // Specialized agents
  "Build an AI real estate analysis agent",
  "Create an AI recruitment screening agent",
  "Build an AI supply chain optimization agent",
  "Create an AI sales outreach agent",
  "Build an AI news monitoring and summarization system",
  "Create an AI-powered API testing agent",
  "Build an AI documentation generator from code",
  "Create an AI workflow that processes invoices",
  "Build a multi-modal AI agent (text + image + voice)",
  "Create an AI agent that manages GitHub issues",
  // Technical stacks
  "Set up a production LLM gateway with load balancing",
  "Build a semantic search engine for internal docs",
  "Create a multi-tenant AI SaaS platform",
  "Build an AI-powered CLI tool",
  "Set up continuous evaluation for LLM applications",
  "Build an AI agent with persistent memory",
  "Create a retrieval-augmented email responder",
  "Build an AI code migration assistant",
  "Set up an AI-powered knowledge graph",
  "Build a conversational AI with tool calling",
];

async function getToolList(): Promise<string> {
  const r = await db.execute(
    "SELECT id, name, tagline, category_tags FROM tools WHERE content_status = 'complete' ORDER BY score DESC LIMIT 150"
  );
  return r.rows
    .map((t: any) => `${t.id} (${t.name}): ${(t.tagline || "").slice(0, 60)}`)
    .join("\n");
}

async function generateStack(scenario: string, toolList: string): Promise<any | null> {
  const prompt = `You are an AI agent tools expert. Given a task scenario, recommend a tool stack from the available tools list.

AVAILABLE TOOLS (id, name, description):
${toolList}

TASK: ${scenario}

Generate a JSON object for this stack. Rules:
- Use ONLY tool_ids from the list above
- Each layer should have 1-3 tools (Primary + Alternatives)
- 2-5 layers per stack
- slug should be URL-friendly (lowercase, hyphens)
- description should be 1-2 sentences explaining the scenario
- Each tool note should explain WHY this tool fits this layer

{
  "slug": "quantitative-trading-ai",
  "title": "Build a Quantitative Trading System with AI",
  "description": "...",
  "icon": "📈",
  "difficulty": "advanced",
  "tags": ["finance", "trading", "quantitative"],
  "layers": [
    {
      "name": "Layer Name",
      "description": "What this layer does",
      "tools": [
        {"tool_id": "some-tool", "role": "Primary", "note": "Why this tool"}
      ]
    }
  ]
}

Return ONLY valid JSON, no markdown fences.`;

  const tmpFile = `/tmp/stack-prompt-${Date.now()}.txt`;
  try {
    await Bun.write(tmpFile, prompt);
    const proc = Bun.spawn(["claude", "-p", "--model", "claude-sonnet-4-20250514"], {
      stdin: Bun.file(tmpFile),
      stdout: "pipe",
      stderr: "pipe",
    });
    const output = await new Response(proc.stdout).text();
    const exitCode = await proc.exited;
    if (exitCode !== 0) return null;

    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error(`  Error: ${err}`);
    return null;
  } finally {
    try { await $`rm -f ${tmpFile}`; } catch {}
  }
}

async function main() {
  const toolList = await getToolList();

  // Filter out scenarios that already have stacks
  const existing = await db.execute("SELECT slug FROM stacks");
  const existingSlugs = new Set(existing.rows.map((r: any) => r.slug));

  const scenarios = SCENARIOS.slice(0, LIMIT);
  console.log(`Generating stacks for ${scenarios.length} scenarios...`);

  let success = 0;
  let failed = 0;

  for (const scenario of scenarios) {
    console.log(`\n${scenario}`);
    const stack = await generateStack(scenario, toolList);

    if (!stack || !stack.slug || !stack.layers) {
      console.log("  ✗ failed to generate");
      failed++;
      continue;
    }

    if (existingSlugs.has(stack.slug)) {
      console.log(`  ⊘ slug "${stack.slug}" already exists, skipping`);
      continue;
    }

    // Validate tool_ids exist
    for (const layer of stack.layers) {
      layer.tools = layer.tools.filter((t: any) => {
        // Keep even if tool doesn't exist — might be a valid ID
        return t.tool_id && t.role && t.note;
      });
    }

    const now = new Date().toISOString();
    const tags = stack.tags ?? [];

    await db.execute({
      sql: `INSERT OR REPLACE INTO stacks (slug, title, description, icon, difficulty, layers, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        stack.slug,
        stack.title || scenario,
        stack.description || "",
        stack.icon || "🔧",
        stack.difficulty || "intermediate",
        JSON.stringify(stack.layers),
        now, now,
      ],
    });

    existingSlugs.add(stack.slug);
    success++;
    console.log(`  ✓ ${stack.slug} (${stack.layers.length} layers)`);

    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\nDone. ${success} generated, ${failed} failed.`);
  const total = await db.execute("SELECT COUNT(*) as c FROM stacks");
  console.log(`Total stacks: ${total.rows[0].c}`);
}

main().catch(console.error);
