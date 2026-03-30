#!/usr/bin/env bun
/**
 * Generate Tool Intelligence — deep analysis of each tool's capabilities.
 * Reads GitHub README, analyzes with Claude, stores structured JSON in DB.
 *
 * Usage: bun run scripts/generate-intelligence.ts [--limit=50]
 */
import { db } from "../src/lib/db";
import { $ } from "bun";

const LIMIT = parseInt(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? "50");
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";

async function fetchReadme(owner: string, repo: string): Promise<string> {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/main/README.md`;
  try {
    const res = await fetch(url, {
      headers: GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {},
    });
    if (!res.ok) {
      // Try master branch
      const res2 = await fetch(url.replace("/main/", "/master/"), {
        headers: GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {},
      });
      if (!res2.ok) return "";
      return (await res2.text()).slice(0, 8000); // Cap at 8k chars
    }
    return (await res.text()).slice(0, 8000);
  } catch {
    return "";
  }
}

async function analyzeWithClaude(toolName: string, tagline: string, readme: string): Promise<any | null> {
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

  const tmpFile = `/tmp/intel-prompt-${Date.now()}.txt`;
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

    // Extract JSON
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch (err: any) {
    console.error(`  Error: ${err.message}`);
    return null;
  } finally {
    try { await $`rm -f ${tmpFile}`; } catch {}
  }
}

async function main() {
  // Get top tools by score that have github_url
  const tools = await db.execute({
    sql: `SELECT id, name, tagline, github_owner, github_repo, github_url
          FROM tools
          WHERE content_status = 'complete'
            AND github_owner IS NOT NULL
            AND github_repo IS NOT NULL
          ORDER BY score DESC
          LIMIT ?`,
    args: [LIMIT],
  });

  console.log(`Generating intelligence for ${tools.rows.length} tools...\n`);

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (const row of tools.rows) {
    const t = row as any;

    // Check if already has intelligence
    const existing = await db.execute({
      sql: "SELECT intelligence FROM tools WHERE id = ? AND intelligence IS NOT NULL AND intelligence != ''",
      args: [t.id],
    });
    if (existing.rows.length > 0) {
      console.log(`  ⊘ ${t.name} — already has intelligence, skipping`);
      skipped++;
      continue;
    }

    console.log(`${t.name} (${t.github_owner}/${t.github_repo})`);

    // Fetch README
    const readme = await fetchReadme(t.github_owner, t.github_repo);
    if (!readme) {
      console.log("  ✗ No README found");
      failed++;
      continue;
    }
    console.log(`  README: ${readme.length} chars`);

    // Analyze with Claude
    const intel = await analyzeWithClaude(t.name, t.tagline || "", readme);
    if (!intel) {
      console.log("  ✗ Analysis failed");
      failed++;
      continue;
    }

    // Store in DB
    await db.execute({
      sql: "UPDATE tools SET intelligence = ? WHERE id = ?",
      args: [JSON.stringify(intel), t.id],
    });

    success++;
    const caps = intel.capabilities?.length || 0;
    const integ = intel.integrations?.length || 0;
    console.log(`  ✓ ${caps} capabilities, ${integ} integrations`);

    // Small delay to avoid rate limits
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\nDone. ${success} analyzed, ${failed} failed, ${skipped} skipped.`);
}

main().catch(console.error);
