/**
 * Publish scheduled dev.to articles (hourly-ops). Schedule: ops/devto-schedule.json [{file, publish_at, tags}],
 * file relative to the repo root, first line "# Title". Before posting, the draft must pass the content-writing check
 * (agentkit skills/content-writing writer.py check: AI-flavour hits = 0); a failing draft fails the run instead of
 * posting. Published URLs are kept in data/devto-published.json so an article never posts twice.
 * Account: agentoolrank's own dev.to key (~/.config/secrets/devto-api-key-agentoolrank). dev.to needs a custom UA.
 * Usage: bun run scripts/devto-publish.ts [--dry-run] [--pretend-due]   (--pretend-due: treat every entry as due, for testing with --dry-run)
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dueEntries, splitTitle, type DevtoEntry } from "../src/lib/devto-schedule";

const ROOT = new URL("../../../", import.meta.url).pathname;
const STATE = new URL("../data/devto-published.json", import.meta.url).pathname;
const dryRun = process.argv.includes("--dry-run");
const schedule: DevtoEntry[] = JSON.parse(readFileSync(`${ROOT}ops/devto-schedule.json`, "utf8"));
const published: Record<string, string> = existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")) : {};
const now = process.argv.includes("--pretend-due") ? new Date(8.64e15) : new Date();
const due = dueEntries(schedule.map((e) => ({ ...e, url: e.url ?? published[e.file] })), now);
if (!due.length) {
  console.log("devto: nothing due");
  process.exit(0);
}
const key = readFileSync(`${process.env.HOME}/.config/secrets/devto-api-key-agentoolrank`, "utf8").trim();
for (const e of due) {
  const md = readFileSync(ROOT + e.file, "utf8");
  const { title, body } = splitTitle(md);
  const check = spawnSync("python3", [`${process.env.HOME}/project/agentkit/skills/content-writing/writer.py`, "check", "--lang", "en", "--format", "longform", ROOT + e.file], { encoding: "utf8", timeout: 900_000 });
  if (!/"clean":\s*true/.test(check.stdout)) throw new Error(`${e.file}: content check not clean, not publishing\n${check.stdout.slice(-500)}`);
  if (dryRun) {
    console.log(`would publish: ${title} (${e.tags.join(",")})`);
    continue;
  }
  const res = await fetch("https://dev.to/api/articles", {
    method: "POST",
    headers: { "api-key": key, "Content-Type": "application/json", "User-Agent": "agentoolrank-ops/1.0" },
    body: JSON.stringify({ article: { title, body_markdown: body, published: true, tags: e.tags, ...(e.series ? { series: e.series } : {}) } }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`dev.to ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
  published[e.file] = data.url;
  writeFileSync(STATE, JSON.stringify(published, null, 2));
  console.log(`published ${e.file} → ${data.url}`);
}
