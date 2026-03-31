#!/usr/bin/env bun
/**
 * Generate Tool Intelligence — deep analysis of each tool's capabilities.
 * Reads GitHub README, analyzes with DeepSeek LLM, stores structured JSON in DB.
 *
 * Usage: bun run scripts/generate-intelligence.ts [--limit=50]
 */
import { createClient } from "@libsql/client";

const LIMIT = parseInt(
  process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? "50"
);

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL!;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN!;
const LLM_API_KEY = process.env.LLM_API_KEY!;
const LLM_BASE_URL = process.env.LLM_BASE_URL || "https://api.deepseek.com";
const LLM_MODEL = process.env.LLM_MODEL || "deepseek-chat";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";

if (!TURSO_DATABASE_URL || !LLM_API_KEY) {
  console.error("Missing TURSO_DATABASE_URL or LLM_API_KEY in env");
  process.exit(1);
}

const db = createClient({ url: TURSO_DATABASE_URL, authToken: TURSO_AUTH_TOKEN });

async function fetchReadme(owner: string, repo: string): Promise<string> {
  const headers: Record<string, string> = {};
  if (GITHUB_TOKEN) headers["Authorization"] = `token ${GITHUB_TOKEN}`;

  for (const branch of ["main", "master"]) {
    try {
      const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/README.md`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        return (await res.text()).slice(0, 8000);
      }
    } catch {}
  }
  return "";
}

async function analyzeWithLLM(
  toolName: string,
  tagline: string,
  readme: string
): Promise<any | null> {
  const prompt = `Analyze this AI tool and generate a structured intelligence profile.

TOOL: ${toolName}
TAGLINE: ${tagline}

README (first 8000 chars):
${readme}

Generate a JSON object with this EXACT structure. Be specific and factual based on the README. If something isn't mentioned, omit it or say "unknown".

{
  "capabilities": ["list of what this tool can do, 3-8 items"],
  "integrations": ["list of services/tools it integrates with natively"],
  "sdk_languages": ["programming languages it supports"],
  "deployment": ["self-hosted", "cloud", "docker", etc.],
  "pricing_detail": {
    "free_tier": "what you get for free",
    "paid_starts_at": "starting price if mentioned"
  },
  "limitations": ["2-3 key limitations or things it can't do"],
  "best_for": ["2-3 ideal use cases"],
  "not_for": ["1-2 things this tool is NOT suitable for"],
  "key_differentiator": "one sentence on what makes this unique vs alternatives"
}

Return ONLY valid JSON. No markdown fences. No explanation.`;

  try {
    const res = await fetch(`${LLM_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a technical analyst. Return ONLY valid JSON, no markdown fences, no explanation.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`  LLM API error ${res.status}: ${errText.slice(0, 200)}`);
      return null;
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Extract JSON from response (handle possible markdown fences)
    const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "");
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch (err: any) {
    console.error(`  LLM Error: ${err.message}`);
    return null;
  }
}

async function main() {
  // Get top tools by score that have github info
  const tools = await db.execute({
    sql: `SELECT id, name, tagline, github_owner, github_repo
          FROM tools
          WHERE content_status = 'complete'
            AND github_owner IS NOT NULL AND github_owner != ''
            AND github_repo IS NOT NULL AND github_repo != ''
            AND (intelligence IS NULL OR intelligence = '')
          ORDER BY score DESC
          LIMIT ?`,
    args: [LIMIT],
  });

  console.log(
    `Found ${tools.rows.length} tools needing intelligence (limit=${LIMIT})\n`
  );

  let success = 0;
  let failed = 0;
  let skipped = 0;
  const total = tools.rows.length;

  for (let i = 0; i < total; i++) {
    const t = tools.rows[i] as any;

    // Progress every 5 tools
    if (i > 0 && i % 5 === 0) {
      console.log(
        `\n--- Progress: ${i}/${total} (success=${success}, failed=${failed}, skipped=${skipped}) ---\n`
      );
    }

    console.log(`[${i + 1}/${total}] ${t.name} (${t.github_owner}/${t.github_repo})`);

    // Fetch README
    const readme = await fetchReadme(t.github_owner, t.github_repo);
    if (!readme || readme.length < 200) {
      console.log(
        `  SKIP: README ${readme ? `too short (${readme.length} chars)` : "not found"}`
      );
      skipped++;
      continue;
    }
    console.log(`  README: ${readme.length} chars`);

    // Analyze with LLM
    const intel = await analyzeWithLLM(t.name, t.tagline || "", readme);
    if (!intel) {
      console.log("  FAIL: Analysis failed");
      failed++;
      continue;
    }

    // Store in DB
    await db.execute({
      sql: "UPDATE tools SET intelligence = ?, updated_at = datetime('now') WHERE id = ?",
      args: [JSON.stringify(intel), t.id],
    });

    success++;
    const caps = intel.capabilities?.length || 0;
    const integ = intel.integrations?.length || 0;
    console.log(`  OK: ${caps} capabilities, ${integ} integrations`);

    // Small delay to avoid rate limits
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(
    `\n========== DONE ==========\nSuccess: ${success}\nFailed:  ${failed}\nSkipped: ${skipped}\nTotal:   ${total}`
  );
}

main().catch(console.error);
