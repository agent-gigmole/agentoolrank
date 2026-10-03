/**
 * Weekly X post from the fastest-growing tools. Owner granted standing approval (2026-10-01) to post
 * directly on the owner's main account via the x-post skill (official API, ≤1 post/day, author disclosed).
 * Usage: bun run scripts/weekly-post.ts [--post]   (without --post: print only)
 *        bun run scripts/weekly-post.ts --post --if-pending   (hourly: retry a post the gate deferred)
 * Every main post on the owner's account first passes a copy check (src/lib/post-copy.ts: no "written by AI" / "auto-posted"),
 * then agentkit bin/post-gate --channel x-main (rules in shared/channels.json) and is logged with bin/post-log;
 * exit 3 = too soon → a pending marker is left and the hourly run retries; exit 2 = unknown → don't post.
 */
import { config } from "dotenv";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createClient } from "@libsql/client";
import { spawnSync } from "node:child_process";
import { weeklyPostText } from "../src/lib/weekly-post";
import { aiAuthorshipMatch } from "../src/lib/post-copy";

config({ path: new URL("../.env.local", import.meta.url).pathname });
const PENDING = new URL("../data/ops-logs/weekly-post-pending.txt", import.meta.url).pathname;
const home = process.env.HOME;

/** Post one file through the gate; returns false (and leaves the pending marker) when the gate says not now. */
function gatedPost(file: string): boolean {
  // Copy check first (owner 10-03 16:31): never say the post itself was written or posted by AI. A hit is a bug, not a delay.
  // Our own patterns plus agentkit's shared bin/post-copy-check, so the two rule sets can't drift apart unnoticed.
  const shared = spawnSync(`${home}/project/agentkit/bin/post-copy-check`, [file], { encoding: "utf8" });
  const hit = aiAuthorshipMatch(readFileSync(file, "utf8")) ?? (shared.status === 0 ? null : (shared.stdout + shared.stderr).trim() || `post-copy-check exit ${shared.status}`);
  if (hit) {
    rmSync(PENDING, { force: true });
    console.log(`copy check: refusing to post, the text says it was AI-written/auto-posted ("${hit}")`);
    process.exitCode = 4;
    return false;
  }
  // Channel rules live in agentkit shared/channels.json (x-main: spacing, fixed slots); the post links to our site.
  const g = spawnSync(`${home}/project/agentkit/bin/post-gate`, ["--channel", "x-main", "--who", "ai-directory", "--has-link"], { encoding: "utf8" });
  if (g.status !== 0) {
    writeFileSync(PENDING, file);
    console.log(`post-gate ${g.status}: not posting now (${(g.stdout + g.stderr).trim()}); pending ${file}`);
    return false;
  }
  const r = spawnSync(`${home}/workspace/twitter-intel/.venv/bin/python`, [`${home}/.claude/skills/x-post/post_tweet.py`, "-f", file], { encoding: "utf8" });
  console.log(r.stdout, r.stderr);
  if (r.status === 0) {
    rmSync(PENDING, { force: true });
    // Log it so post-gate sees this post without relying on the platform API (~/data/distribution/posts.jsonl).
    const url = /posted[^:]*: (https:\/\/x\.com\/\S+)/.exec(r.stdout)?.[1] ?? "unknown";
    const l = spawnSync(`${home}/project/agentkit/bin/post-log`, ["--channel", "x-main", "--who", "ai-directory", "--url", url, "--link", "--kind", "main"], { encoding: "utf8" });
    console.log(`post-log ${l.status}: ${url}`);
  }
  return r.status === 0;
}

if (process.argv.includes("--if-pending")) {
  if (existsSync(PENDING)) gatedPost(readFileSync(PENDING, "utf8").trim());
  process.exit(process.exitCode ?? 0);
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
