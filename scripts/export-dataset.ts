#!/usr/bin/env bun
/**
 * Export tools database to JSON and CSV for the open source dataset.
 *
 * Usage: bun run scripts/export-dataset.ts [--output-dir /path/to/dir]
 */
import { db } from "../src/lib/db";

const OUTPUT_DIR = process.argv.find((a) => a.startsWith("--output-dir="))?.split("=")[1] ?? "/tmp/awesome-ai-agent-tools";

interface ToolRow {
  id: string;
  name: string;
  tagline: string;
  description: string;
  website_url: string;
  github_url: string | null;
  github_owner: string | null;
  github_repo: string | null;
  category_tags: string;
  github_stars: number | null;
  star_velocity_30d: number | null;
  last_commit_date: string | null;
  release_count_6m: number | null;
  pricing: string;
  score: number;
  percentile_rank: number | null;
}

async function main() {
  const result = await db.execute(
    "SELECT id, name, tagline, description, website_url, github_url, github_owner, github_repo, category_tags, github_stars, star_velocity_30d, last_commit_date, release_count_6m, pricing, score, percentile_rank FROM tools WHERE content_status = 'complete' ORDER BY score DESC"
  );

  const tools = result.rows as unknown as ToolRow[];
  console.log(`Exporting ${tools.length} tools...`);

  // JSON export
  const jsonData = tools.map((t) => ({
    id: t.id,
    name: t.name,
    tagline: t.tagline,
    website: t.website_url,
    github: t.github_url,
    categories: JSON.parse(t.category_tags || "[]"),
    stars: t.github_stars,
    star_velocity_30d: t.star_velocity_30d ? Math.round(t.star_velocity_30d) : null,
    last_commit: t.last_commit_date,
    releases_6m: t.release_count_6m,
    pricing: t.pricing,
    score: Math.round(t.score * 1000) / 1000,
    rank_percentile: t.percentile_rank ? Math.round(t.percentile_rank * 100) : null,
  }));

  await Bun.write(`${OUTPUT_DIR}/data/tools.json`, JSON.stringify(jsonData, null, 2));
  console.log(`  ✓ tools.json (${jsonData.length} tools)`);

  // CSV export
  const csvHeader = "id,name,tagline,website,github,categories,stars,star_velocity_30d,last_commit,releases_6m,pricing,score,rank_percentile";
  const csvRows = jsonData.map((t) => {
    const escape = (s: string) => `"${(s || "").replace(/"/g, '""')}"`;
    return [
      t.id,
      escape(t.name),
      escape(t.tagline),
      t.website,
      t.github || "",
      escape(t.categories.join(";")),
      t.stars ?? "",
      t.star_velocity_30d ?? "",
      t.last_commit || "",
      t.releases_6m ?? "",
      t.pricing,
      t.score,
      t.rank_percentile ?? "",
    ].join(",");
  });

  await Bun.write(`${OUTPUT_DIR}/data/tools.csv`, [csvHeader, ...csvRows].join("\n"));
  console.log(`  ✓ tools.csv`);

  // Categories export
  const cats = await db.execute("SELECT slug, name, description, icon, tool_count FROM categories ORDER BY tool_count DESC");
  await Bun.write(`${OUTPUT_DIR}/data/categories.json`, JSON.stringify(cats.rows, null, 2));
  console.log(`  ✓ categories.json`);

  // Stats
  const totalStars = jsonData.reduce((sum, t) => sum + (t.stars ?? 0), 0);
  console.log(`\nDataset stats:`);
  console.log(`  Tools: ${jsonData.length}`);
  console.log(`  Total GitHub stars tracked: ${totalStars.toLocaleString()}`);
  console.log(`  Categories: ${cats.rows.length}`);
  console.log(`  Output: ${OUTPUT_DIR}/data/`);
}

main().catch(console.error);
