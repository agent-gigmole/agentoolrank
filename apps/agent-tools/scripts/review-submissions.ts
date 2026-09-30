/**
 * Review pending /submit entries: badge check → fetch site + README → LLM verdict →
 * (with --apply) insert approved tools, mark submissions, then backfill alternatives/related.
 * Usage:
 *   bun run scripts/review-submissions.ts                 # dry run over the queue
 *   bun run scripts/review-submissions.ts --apply [--free=3]
 *   bun run scripts/review-submissions.ts --try <url> [github_url]   # test one site, no DB writes
 */
import { config } from "dotenv";
import { createClient } from "@libsql/client";
import { spawnSync } from "node:child_process";
import { parseReview, toolRowFromReview, hasBacklink, reviewOrder, type Review } from "../src/lib/review";

config({ path: new URL("../.env.local", import.meta.url).pathname });
const MODEL = "deepseek/deepseek-v3.2";
const args = process.argv.slice(2);
const apply = args.includes("--apply");
const freeQuota = Number(args.find((a) => a.startsWith("--free="))?.split("=")[1] ?? 3);
const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });

async function fetchText(url: string, max = 3000): Promise<{ html: string; text: string }> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "AgentoolRank-Review/1.0 (+https://agentoolrank.com/submit)" }, signal: AbortSignal.timeout(15000) });
    const html = await res.text();
    const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return { html, text: text.slice(0, max) };
  } catch {
    return { html: "", text: "" };
  }
}

async function readme(githubUrl: string | null): Promise<string> {
  const m = githubUrl?.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!m) return "";
  return (await fetchText(`https://raw.githubusercontent.com/${m[1]}/${m[2]}/HEAD/README.md`, 3000)).text;
}

async function judge(name: string, url: string, tagline: string, site: string, rd: string, categories: Array<{ slug: string; name: string }>): Promise<Review | null> {
  const prompt = `You review submissions to AgentoolRank, a directory of tools for BUILDING, RUNNING or EVALUATING AI agents (agent frameworks, coding agents, memory/RAG, tool integration/MCP, browser agents, sandboxes, observability/evals, voice agents, no-code agent builders, agent platforms).

Approve only if the product is such a tool. Reject: generic AI apps for end users (AI writers, chatbots for customers, image generators), non-AI products, content farms, broken or placeholder sites. Base every field ONLY on the evidence below; don't invent features.

Submission: ${name} — ${tagline} (${url})
Website text: ${site || "(could not fetch)"}
README: ${rd || "(none)"}

Categories (use the slug): ${categories.map((c) => `${c.slug} (${c.name})`).join(", ")}

Reply with JSON only:
{"decision":"approve"|"reject","reason":"one sentence","category":"<slug>","tagline":"<=120 chars","description":"2-3 factual sentences","pricing":"free"|"freemium"|"paid"|"open-source",
 "intelligence":{"capabilities":["..."],"integrations":["..."],"best_for":["..."],"not_for":["..."],"limitations":["..."],"key_differentiator":"one sentence"}}`;
  const res = await fetch(`${process.env.LLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.LLM_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, messages: [{ role: "user", content: prompt }], temperature: 0.1, max_tokens: 1200 }),
  });
  if (!res.ok) throw new Error(`LLM ${res.status}`);
  const data = await res.json();
  return parseReview(data.choices?.[0]?.message?.content ?? "", categories.map((c) => c.slug));
}

async function main() {
  const categories = (await db.execute("SELECT slug, name FROM categories")).rows as unknown as Array<{ slug: string; name: string }>;

  if (args[0] === "--try") {
    const [url, gh = null] = args.slice(1);
    const site = await fetchText(url);
    const r = await judge(new URL(url).hostname, url, "", site.text, await readme(gh), categories);
    console.log(JSON.stringify({ backlink: hasBacklink(site.html), ...r }, null, 2));
    return;
  }

  let subs: Array<{ id: number; slug: string; name: string; url: string; github_url: string | null; tagline: string; plan: string; backlink_verified: number }>;
  try {
    subs = (await db.execute("SELECT * FROM submissions WHERE status = 'pending'")).rows as never;
  } catch {
    console.log("no submissions table yet");
    return;
  }

  // Refresh badge status so badge holders move up.
  const pages = new Map<number, { html: string; text: string }>();
  for (const s of subs) {
    const page = await fetchText(s.url);
    pages.set(s.id, page);
    const verified = hasBacklink(page.html) ? 1 : 0;
    if (verified !== s.backlink_verified && apply) await db.execute({ sql: "UPDATE submissions SET backlink_verified = ? WHERE id = ?", args: [verified, s.id] });
    s.backlink_verified = verified;
  }
  subs.sort(reviewOrder);
  const paid = subs.filter((s) => s.plan !== "free");
  const batch = [...paid, ...subs.filter((s) => s.plan === "free").slice(0, freeQuota)];
  console.log(`pending=${subs.length} reviewing=${batch.length} (paid ${paid.length}, free quota ${freeQuota}) apply=${apply}`);

  let approved = 0;
  for (const s of batch) {
    const r = await judge(s.name, s.url, s.tagline, pages.get(s.id)?.text ?? "", await readme(s.github_url), categories);
    if (!r) { console.log(`#${s.id} ${s.slug}: unparseable verdict, skipped`); continue; }
    console.log(`#${s.id} ${s.slug}: ${r.decision} [${r.category}] ${r.reason}${s.backlink_verified ? " (badge)" : ""}`);
    if (!apply) continue;
    if (r.decision === "approve") {
      const exists = await db.execute({ sql: "SELECT 1 FROM tools WHERE id = ?", args: [s.slug] });
      if (exists.rows.length > 0) {
        await db.execute({ sql: "UPDATE submissions SET status='rejected', note='slug already listed', reviewed_at=datetime('now') WHERE id=?", args: [s.id] });
        continue;
      }
      const row = toolRowFromReview(s, r);
      const cols = Object.keys(row);
      await db.execute({ sql: `INSERT INTO tools (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`, args: Object.values(row) as never });
      approved++;
    }
    await db.execute({ sql: "UPDATE submissions SET status=?, note=?, reviewed_at=datetime('now') WHERE id=?", args: [r.decision === "approve" ? "approved" : "rejected", r.reason, s.id] });
  }

  if (apply && approved > 0) {
    for (const script of ["scripts/generate-alternatives.ts", "scripts/fill-related.ts"]) {
      spawnSync("bun", ["run", script], { stdio: "inherit", cwd: new URL("..", import.meta.url).pathname });
    }
  }
  console.log(`approved=${approved}`);
}

main();
