/**
 * Monday weekly review, numbers part (timer agentoolrank-weekly-numbers, Monday 08:50 Beijing): regenerate the
 * "## 记分牌" section of docs/ops/weekly/<monday>.md from ops/scoreboard.json + data/kpi-latest.json (both written
 * by the hourly pipeline), then commit and push just that file. Conclusions, competitors and bets stay hand/bin/write.
 * Usage: bun run scripts/weekly-numbers.ts [--no-push]
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { replaceScoreboard, reviewMonday, scoreboardTable } from "../src/lib/weekly-numbers";

const ROOT = new URL("../../../", import.meta.url).pathname;
const board = JSON.parse(readFileSync(`${ROOT}ops/scoreboard.json`, "utf8"));
const kpi = JSON.parse(readFileSync(new URL("../data/kpi-latest.json", import.meta.url).pathname, "utf8"));
const monday = reviewMonday(new Date());
const rel = `docs/ops/weekly/${monday}.md`;
const file = ROOT + rel;
const takenAt = new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 16).replace("T", " ");

const section = scoreboardTable({
  takenAt,
  board,
  submit: kpi.submitFunnel,
  kit: kpi.kitFunnel,
  outreach: { sent: kpi.outreachSent, sessions7d: kpi.outreachVisitors7d },
  dirLive: kpi.dirLive,
  gscClicks28d: kpi.gscClicks28d,
});
const doc = existsSync(file) ? readFileSync(file, "utf8") : `# 本周经营 · ${monday}（周一）｜草案，周一 12:00 前定稿\n\n`;
writeFileSync(file, replaceScoreboard(doc, section));
console.log(`weekly numbers → ${rel}`);

const git = (...a: string[]) => spawnSync("git", ["-C", ROOT, ...a], { encoding: "utf8", env: { ...process.env, GITHUB_TOKEN: "" } });
if (git("diff", "--quiet", "--", rel).status === 0 && existsSync(file) && git("ls-files", "--error-unmatch", rel).status === 0) {
  console.log("no change");
  process.exit(0);
}
git("add", "--", rel);
const c = git("commit", "-m", `docs: 本周经营记分牌自动取数（${takenAt}）`, "--", rel);
if (c.status !== 0) throw new Error(`commit failed: ${c.stderr || c.stdout}`);
if (!process.argv.includes("--no-push")) {
  const token = readFileSync(`${process.env.HOME}/.config/secrets/github-agentoolrank`, "utf8").trim();
  const p = git("-c", "credential.helper=", "push", "-q", `https://x-access-token:${token}@github.com/agent-gigmole/agentoolrank.git`, "main");
  if (p.status !== 0) throw new Error("push failed"); // never print the URL, it carries the token
}
console.log("committed");
