/**
 * Cold-start expansion: GitHub search → candidate repos → LLM quality gate (README evidence) → insert.
 * Usage: bun run scripts/expand-tools.ts [--apply] [--max-judge=300] [--max-add=200]
 * Needs GITHUB_TOKEN (search API). Budget guard: stops judging at MAX_USD.
 */
import { config } from "dotenv";
import { createClient } from "@libsql/client";
import { pickCandidates, type GhRepo } from "../src/lib/discover";
import { toolRowFromReview, submissionTagline } from "../src/lib/review";
import { judge, readme, spentUsd } from "./judge";
import { unsafeMatch } from "../src/lib/safety";

config({ path: new URL("../.env.local", import.meta.url).pathname });
const args = process.argv.slice(2);
const apply = args.includes("--apply");
const num = (k: string, d: number) => Number(args.find((a) => a.startsWith(`--${k}=`))?.split("=")[1] ?? d);
const MAX_JUDGE = num("max-judge", 300), MAX_ADD = num("max-add", 200), MAX_USD = 0.6;
const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });

const since = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
const QUERIES = [
  "topic:mcp-server", "topic:mcp", "topic:model-context-protocol", "topic:ai-agents", "topic:ai-agent", "topic:llm-agent",
  "topic:agent-framework", "topic:agentic-ai", "topic:multi-agent", "topic:coding-agent", "topic:browser-automation llm",
  "topic:rag", "topic:llm-observability", "topic:llm-evaluation", "topic:agent-memory", "topic:computer-use",
].map((q) => `${q} stars:>=300 pushed:>=${since}`);

async function search(q: string): Promise<GhRepo[]> {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=100`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: "application/vnd.github+json" } });
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${(await res.text()).slice(0, 120)}`);
  return (await res.json()).items as GhRepo[];
}

function siteUrl(r: GhRepo): string {
  const raw = (r.homepage ?? "").trim();
  if (!raw) return r.html_url;
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withScheme).toString().replace(/\/$/, "");
  } catch {
    return r.html_url;
  }
}

const slugOf = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

async function main() {
  const tools = (await db.execute("SELECT id, github_owner, github_repo FROM tools")).rows as unknown as Array<{ id: string; github_owner: string | null; github_repo: string | null }>;
  const listed = new Set(tools.filter((t) => t.github_owner).map((t) => `${t.github_owner}/${t.github_repo}`.toLowerCase()));
  const archived = (await db.execute("SELECT id FROM tools_archive").catch(() => ({ rows: [] }))).rows.map((r) => String(r.id));
  const ids = new Set([...tools.map((t) => t.id), ...archived]); // delisted tools are never re-added
  // Repos move between orgs (block/goose → aaif-goose/goose); a repo-name match means "already listed".
  const repoNames = new Set(tools.filter((t) => t.github_repo).map((t) => String(t.github_repo).toLowerCase()));
  const categories = (await db.execute("SELECT slug, name FROM categories")).rows as unknown as Array<{ slug: string; name: string }>;

  const all: GhRepo[] = [];
  for (const q of QUERIES) {
    try {
      all.push(...(await search(q)));
    } catch (e) {
      console.error(`search failed (${q}): ${(e as Error).message}`);
    }
    await new Promise((r) => setTimeout(r, 2500)); // search API: 30 req/min
  }
  const candidates = pickCandidates(all, listed, MAX_JUDGE);
  console.log(`search results=${all.length} candidates=${candidates.length} apply=${apply}`);

  let added = 0, rejected = 0, judged = 0;
  const rejectedLog: string[] = [];
  const queue = [...candidates];
  async function worker() {
    while (queue.length && added < MAX_ADD && spentUsd < MAX_USD) {
      const r = queue.shift()!;
      const repoName = r.full_name.split("/")[1];
      const slug = slugOf(repoName);
      if (ids.has(slug) || repoNames.has(repoName.toLowerCase())) continue; // probably the same tool under a moved org
      ids.add(slug); // reserve before the slow LLM call so parallel workers don't double-insert
      repoNames.add(repoName.toLowerCase());
      const pre = unsafeMatch(`${r.full_name} ${r.description ?? ""} ${siteUrl(r)}`);
      if (pre) { rejected++; rejectedLog.push(`${r.full_name}: unsafe category "${pre}"`); continue; }
      const verdict = await judge(repoName, siteUrl(r), r.description ?? "", "", await readme(r.html_url), categories);
      judged++;
      const post = verdict ? unsafeMatch(`${verdict.tagline} ${verdict.description}`) : null;
      if (post) { rejected++; rejectedLog.push(`${r.full_name}: unsafe category "${post}"`); continue; }
      if (!verdict || verdict.decision !== "approve") {
        rejected++;
        rejectedLog.push(`${r.full_name}: ${verdict?.reason ?? "unparseable"}`);
        continue;
      }
      if (apply) {
        const row = { ...toolRowFromReview({ slug, name: repoName, url: siteUrl(r), github_url: r.html_url, tagline: submissionTagline(r.description ?? "") }, verdict), source: "github" as const, github_stars: r.stargazers_count };
        const cols = Object.keys(row);
        await db.execute({ sql: `INSERT OR IGNORE INTO tools (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`, args: Object.values(row) as never });
      }
      added++;
      if (added % 20 === 0) console.log(`progress added=${added} judged=${judged} spent=$${spentUsd.toFixed(3)}`);
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker));
  console.log(`done judged=${judged} added=${added} rejected=${rejected} (reject rate ${(100 * rejected / Math.max(judged, 1)).toFixed(0)}%) spent=$${spentUsd.toFixed(3)}`);
  console.log("sample rejections:\n  " + rejectedLog.slice(0, 12).join("\n  "));
}

main();
