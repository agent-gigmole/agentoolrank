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
import { toolRowFromReview, hasBacklink, reviewOrder } from "../src/lib/review";
import { fetchText, readme, judge } from "./judge";

config({ path: new URL("../.env.local", import.meta.url).pathname });
const args = process.argv.slice(2);
const apply = args.includes("--apply");
const freeQuota = Number(args.find((a) => a.startsWith("--free="))?.split("=")[1] ?? 3);
const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });

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

  // Paid plans live in the payments table (priority/fast/featured); fall back to submissions.plan.
  try {
    const paidRows = (await db.execute("SELECT submission_id, plan FROM payments")).rows as unknown as Array<{ submission_id: number; plan: string }>;
    const paidBy = new Map(paidRows.map((p) => [Number(p.submission_id), p.plan]));
    for (const s of subs) if (paidBy.has(Number(s.id))) s.plan = paidBy.get(Number(s.id))!;
  } catch {
    // no payments yet
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
