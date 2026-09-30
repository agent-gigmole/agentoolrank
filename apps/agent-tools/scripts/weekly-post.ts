/**
 * Draft the weekly X post from the fastest-growing tools and send it to Telegram for approval.
 * Usage: bun run scripts/weekly-post.ts [--send]
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
if (process.argv.includes("--send")) {
  spawnSync("telegram-topic", ["send", "目录站", `[目录站] 本周 X 帖草稿，回「发」即发：\n\n${text}`], { stdio: "inherit" });
}
