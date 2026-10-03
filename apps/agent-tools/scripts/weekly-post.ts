/**
 * Weekly X post from the fastest-growing tools. Owner granted standing approval (2026-10-01) to post
 * directly on the owner's main account via the x-post skill (official API, ≤1 post/day, author disclosed).
 * Usage: bun run scripts/weekly-post.ts [--post]   (without --post: print only)
 *        bun run scripts/weekly-post.ts --post --if-pending   (hourly: retry a post the gate deferred)
 * Every main post on the owner's account first passes agentkit bin/post-gate (≥3h since the account's last main post);
 * exit 3 = too soon → a pending marker is left and the hourly run retries; exit 2 = unknown → don't post.
 */
import { config } from "dotenv";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createClient } from "@libsql/client";
import { spawnSync } from "node:child_process";
import { weeklyPostText } from "../src/lib/weekly-post";

config({ path: new URL("../.env.local", import.meta.url).pathname });
const PENDING = new URL("../data/ops-logs/weekly-post-pending.txt", import.meta.url).pathname;
const home = process.env.HOME;

/** Post one file through the gate; returns false (and leaves the pending marker) when the gate says not now. */
function gatedPost(file: string): boolean {
  const g = spawnSync(`${home}/project/agentkit/bin/post-gate`, ["--platform", "x", "--who", "ai-directory"], { encoding: "utf8" });
  if (g.status !== 0) {
    writeFileSync(PENDING, file);
    console.log(`post-gate ${g.status}: not posting now (${(g.stdout + g.stderr).trim()}); pending ${file}`);
    return false;
  }
  const r = spawnSync(`${home}/workspace/twitter-intel/.venv/bin/python`, [`${home}/.claude/skills/x-post/post_tweet.py`, "-f", file], { encoding: "utf8" });
  console.log(r.stdout, r.stderr);
  if (r.status === 0) rmSync(PENDING, { force: true });
  return r.status === 0;
}

if (process.argv.includes("--if-pending")) {
  if (existsSync(PENDING)) gatedPost(readFileSync(PENDING, "utf8").trim());
  process.exit(0);
}
const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });

// Prefer real 7-day gains once daily snapshots cover a week; otherwise fall back to the 30-day pace.
const week = (await db.execute(`
  SELECT t.id, t.name, t.tagline, (s1.github_stars - s0.github_stars) AS gain
  FROM tools t
  JOIN metric_snapshots s1 ON s1.tool_id = t.id AND s1.date = (SELECT MAX(date) FROM metric_snapshots WHERE tool_id = t.id)
  JOIN metric_snapshots s0 ON s0.tool_id = t.id AND s0.date = (SELECT MAX(date) FROM metric_snapshots WHERE tool_id = t.id AND date <= date('now', '-7 days') AND date >= date('now', '-10 days'))
  ORDER BY gain DESC LIMIT 5`)).rows as unknown as Array<{ id: string; name: string; tagline: string; gain: number }>;
const tools = week.length >= 5
  ? week
  : ((await db.execute("SELECT id, name, tagline, star_velocity_30d AS gain FROM tools WHERE star_velocity_30d IS NOT NULL ORDER BY star_velocity_30d DESC LIMIT 5")).rows as unknown as typeof week);

const now = new Date();
const label = `${now.getMonth() + 1}/${now.getDate()}`;
const text = weeklyPostText(tools, label, "https://agentoolrank.com") + (week.length >= 5 ? "" : "\n\n（注：数据是 30 天增速，攒满 7 天每日数据后改为真实周增量）");
console.log(text);
if (process.argv.includes("--post")) {
  const file = new URL(`../data/ops-logs/weekly-post-${now.toISOString().slice(0, 10)}.txt`, import.meta.url).pathname;
  writeFileSync(file, text);
  gatedPost(file);
}
