/**
 * ai-directory side of the cross-project feedback inbox (~/data/feedback/feedback.jsonl, format in its README.md).
 *   bun run scripts/feedback.ts collect        dev.to comments on our articles + GitHub issues on our repo (hourly cron)
 *   bun run scripts/feedback.ts add --source email --author <a> --url <u> --kind suggestion --text "<original>"
 *                                              (outreach replies / user mail found in the hello@ inbox)
 *   bun run scripts/feedback.ts decide <id> adopted|declined|answered "<decision>" [ticket] --hit "<说中了什么>" --misread "<误解了什么>" --want "<想要而我们没有的>"
 *                                              (boss 10-03 16:11: read every reply as an outside review of the product)
 *   bun run scripts/feedback.ts list           our entries still waiting for a decision (overdue = past 48h)
 */
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { PROJECT, currentById, devtoComments, newFeedback, overdue, type FeedbackRow, type Found } from "../src/lib/feedback";

const INBOX = `${process.env.HOME}/data/feedback/feedback.jsonl`;
const UA = { "User-Agent": "agentoolrank-ops/1.0" };
const now = () => Math.floor(Date.now() / 1000);
const rows = (): FeedbackRow[] =>
  existsSync(INBOX) ? readFileSync(INBOX, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [];
const append = (r: FeedbackRow) => appendFileSync(INBOX, JSON.stringify(r) + "\n");
const flag = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
};

async function collect() {
  const found: (Found & { source: string; kind: string })[] = [];
  const key = readFileSync(`${process.env.HOME}/.config/secrets/devto-api-key-agentoolrank`, "utf8").trim();
  const articles = await (await fetch("https://dev.to/api/articles/me/all?per_page=100", { headers: { ...UA, "api-key": key } })).json();
  for (const a of articles) {
    if (!a.comments_count) continue;
    const comments = await (await fetch(`https://dev.to/api/comments?a_id=${a.id}`, { headers: UA })).json();
    found.push(...devtoComments(a.id, a.url, comments).map((c) => ({ ...c, source: "other", kind: "other" })));
  }
  const issues = await (await fetch("https://api.github.com/repos/agent-gigmole/agentoolrank/issues?state=all&per_page=100", { headers: UA })).json();
  if (Array.isArray(issues))
    for (const i of issues)
      found.push({ id: `github:agentoolrank#${i.number}`, url: i.html_url, author: i.user?.login ?? "", text: `${i.title}\n${i.body ?? ""}`.slice(0, 1000), source: "other", kind: i.pull_request ? "other" : "suggestion" });
  const fresh = newFeedback(new Set(currentById(rows()).keys()), found);
  for (const f of fresh) append({ ...f, project: PROJECT, collected_at: now(), status: "new", decision: "" });
  console.log(`feedback collect: ${found.length} seen, ${fresh.length} new`);
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === "collect") await collect();
else if (cmd === "add") {
  const id = flag("id") ?? `${flag("source") ?? "email"}:${flag("author")}:${now()}`;
  append({ id, source: flag("source") ?? "email", url: flag("url") ?? "", author: flag("author") ?? "", text: (flag("text") ?? "").slice(0, 1000), project: PROJECT, kind: flag("kind") ?? "other", collected_at: now(), status: "new", decision: "" });
  console.log(`added ${id}`);
} else if (cmd === "decide") {
  const [id, status, decision, ticket] = rest.filter((a, i) => !a.startsWith("--") && !rest[i - 1]?.startsWith("--"));
  const review = { hit: flag("hit") ?? "", misread: flag("misread") ?? "", want: flag("want") ?? "" };
  const cur = currentById(rows()).get(id);
  if (!cur || !["adopted", "declined", "answered"].includes(status) || !decision) throw new Error("usage: decide <existing id> adopted|declined|answered \"<decision>\" [ticket]");
  append({ ...cur, status, decision, review, ...(ticket ? { ticket } : {}) });
  console.log(`${id} → ${status}`);
} else {
  const open = [...currentById(rows()).values()].filter((r) => r.project === PROJECT && r.status === "new");
  const late = new Set(overdue(rows(), now()).map((r) => r.id));
  for (const r of open) console.log(`${late.has(r.id) ? "⚠️ 超 48h " : ""}${r.id} · ${r.author} · ${String(r.text ?? "").slice(0, 80)}`);
  console.log(`ai-directory 待处理 ${open.length}，超时 ${late.size}`);
}
