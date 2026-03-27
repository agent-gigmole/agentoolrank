#!/usr/bin/env bun
/**
 * Compute ranking scores for all tools using percentile rank.
 * Run after crawl-github.ts to update scores.
 *
 * Usage: bun run scripts/compute-rankings.ts
 */
import { db } from "../src/lib/db";

function percentileRank(values: number[], value: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const below = sorted.filter((v) => v < value).length;
  const equal = sorted.filter((v) => v === value).length;
  return (below + 0.5 * equal) / sorted.length;
}

function recencyScore(dateStr: string | null): number {
  if (!dateStr) return 0;
  const days = (Date.now() - new Date(dateStr).getTime()) / 86400000;
  // Exponential decay: 1.0 at day 0, 0.5 at day 30, 0.1 at day 90
  return Math.exp(-0.0231 * days);
}

async function main() {
  console.log("Computing rankings...");

  // Get all tools
  const result = await db.execute("SELECT id, github_stars, star_velocity_30d, commit_count_90d, release_count_6m, last_commit_date FROM tools");
  const tools = result.rows as Array<{
    id: string;
    github_stars: number | null;
    star_velocity_30d: number | null;
    commit_count_90d: number | null;
    release_count_6m: number | null;
    last_commit_date: string | null;
  }>;

  if (tools.length === 0) {
    console.log("No tools to rank.");
    return;
  }

  // Compute star_velocity_30d from snapshots (if enough history)
  for (const tool of tools) {
    const snapshots = await db.execute({
      sql: "SELECT github_stars, date FROM metric_snapshots WHERE tool_id = ? ORDER BY date ASC",
      args: [tool.id],
    });
    if (snapshots.rows.length >= 2) {
      const first = snapshots.rows[0] as { github_stars: number; date: string };
      const last = snapshots.rows[snapshots.rows.length - 1] as { github_stars: number; date: string };
      const daysDiff = (new Date(last.date).getTime() - new Date(first.date).getTime()) / 86400000;
      if (daysDiff > 0) {
        tool.star_velocity_30d = ((last.github_stars - first.github_stars) / daysDiff) * 30;
      }
    }
    // If only 1 snapshot (first day), use stars/age as rough estimate
    if (tool.star_velocity_30d === null && tool.github_stars !== null && tool.github_stars > 0) {
      // Rough estimate: assume repo is ~1 year old, extrapolate 30-day velocity
      tool.star_velocity_30d = tool.github_stars / 12;
    }
  }

  // Collect non-null values for percentile computation
  const velocities = tools.map((t) => t.star_velocity_30d).filter((v): v is number => v !== null);
  const commits = tools.map((t) => t.commit_count_90d).filter((v): v is number => v !== null);
  const releases = tools.map((t) => t.release_count_6m).filter((v): v is number => v !== null);

  // Compute scores
  const scores: Array<{ id: string; score: number; velocity: number | null }> = [];

  for (const tool of tools) {
    const velRank = tool.star_velocity_30d !== null && velocities.length > 0
      ? percentileRank(velocities, tool.star_velocity_30d) : 0.5;
    const commitRank = tool.commit_count_90d !== null && commits.length > 0
      ? percentileRank(commits, tool.commit_count_90d) : 0.5;
    const releaseRank = tool.release_count_6m !== null && releases.length > 0
      ? percentileRank(releases, tool.release_count_6m) : 0.5;
    const recency = recencyScore(tool.last_commit_date);

    const score = 0.35 * velRank + 0.30 * commitRank + 0.20 * releaseRank + 0.15 * recency;

    scores.push({ id: tool.id, score, velocity: tool.star_velocity_30d });
  }

  // Sort and assign percentile ranks
  scores.sort((a, b) => a.score - b.score);
  for (let i = 0; i < scores.length; i++) {
    const pRank = (i + 0.5) / scores.length;

    await db.execute({
      sql: "UPDATE tools SET score = ?, percentile_rank = ?, star_velocity_30d = ? WHERE id = ?",
      args: [scores[i].score, pRank, scores[i].velocity, scores[i].id],
    });
  }

  console.log(`Ranked ${scores.length} tools.`);

  // Show top 10
  const top = await db.execute("SELECT id, name, score, github_stars, star_velocity_30d FROM tools ORDER BY score DESC LIMIT 10");
  console.log("\nTop 10:");
  for (const row of top.rows) {
    const r = row as { id: string; name: string; score: number; github_stars: number; star_velocity_30d: number };
    console.log(`  ${r.name.padEnd(25)} score=${r.score.toFixed(3)} ★${r.github_stars} vel=${r.star_velocity_30d?.toFixed(0) ?? 'N/A'}/mo`);
  }
}

main().catch(console.error);
