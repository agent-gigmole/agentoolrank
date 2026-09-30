/**
 * Weekly X post from the fastest-growing tools. Owner granted standing approval (2026-10-01) to post
 * directly on the owner's main account via the x-post skill (official API, ≤1 post/day, author disclosed).
 * Usage: bun run scripts/weekly-post.ts [--post]   (without --post: print only)
 */
import { config } from "dotenv";
import { createClient } from "@libsql/client";
import { spawnSync } from "node:child_process";
import { weeklyPostText } from "../src/lib/weekly-post";

config({ path: new URL("../.env.local", import.meta.url).pathname });
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
  const { writeFileSync } = await import("node:fs");
  const file = new URL(`../data/ops-logs/weekly-post-${now.toISOString().slice(0, 10)}.txt`, import.meta.url).pathname;
  writeFileSync(file, text);
  const home = process.env.HOME;
  const r = spawnSync(`${home}/workspace/twitter-intel/.venv/bin/python`, [`${home}/.claude/skills/x-post/post_tweet.py`, "-f", file], { encoding: "utf8" });
  console.log(r.stdout, r.stderr);
}
