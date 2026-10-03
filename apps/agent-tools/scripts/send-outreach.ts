/**
 * Maker outreach (T17): send the outreach email to candidates from data/outreach/candidates.json via Brevo.
 * - Max 10 per China-time day (counted from data/outreach/sent.json), one email per address ever, no follow-ups.
 * - Skips addresses in data/outreach/optout.json (people who replied "no") and mailing-list / no-reply addresses.
 * - Skips slugs in data/outreach/hold.json ({ slug: reason }), e.g. tools whose listing/category is under review.
 * - data/outreach/category.json ({ slug: category-slug }) pins the category to report when the tool's best-ranking
 *   category isn't its real home (must be one of its stored categories).
 * - Rank / total / name are recomputed from the live DB so the email never states stale numbers.
 * - Skips (and opts out) addresses whose domain has no MX, or that the shared Brevo account already blocked.
 * Usage: bun run scripts/send-outreach.ts [--dry-run] [--limit=N] [--test=you@example.com] [--require-healthy]
 *   --require-healthy (nightly timer agentoolrank-outreach): check 7-day Brevo stats first and exit 2 without sending
 *   if our tag had any bounce/block/spam/invalid, or the shared account any spam report/block (lib/outreach sendingBlocked).
 *   --test sends one sample (first candidate's content) to the given address only and records nothing.
 */
import { config } from "dotenv";
import { createClient } from "@libsql/client";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { outreachEmail, isGroupAddress, mxVerdict, preflightSkip, sendingBlocked, type BrevoStats } from "../src/lib/outreach";
import { resolveMx } from "node:dns/promises";
import { downloadsLine } from "../src/lib/downloads";
import { cstDayRange } from "../src/lib/kpi";

config({ path: new URL("../.env.local", import.meta.url).pathname, quiet: true });
const BASE = "https://agentoolrank.com";
const DAILY_CAP = 10;
const dir = new URL("../data/outreach/", import.meta.url).pathname;
const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=")[1];
const dryRun = process.argv.includes("--dry-run");
const test = arg("test");
const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });

interface Candidate { slug: string; owner: string; email: string; email_source: string }
interface Sent { email: string; slug: string; at: string; messageId: string }
const load = <T>(f: string, d: T): T => (existsSync(dir + f) ? JSON.parse(readFileSync(dir + f, "utf8")) : d);
const candidates = load<Candidate[]>("candidates.json", []);
const sent = load<Sent[]>("sent.json", []);
const optout = new Set(load<string[]>("optout.json", []).map((e) => e.toLowerCase()));
const hold = load<Record<string, string>>("hold.json", {});
const pinned = load<Record<string, string>>("category.json", {});

async function live(slug: string) {
  const t = (await db.execute({ sql: "SELECT id, name, category_tags FROM tools WHERE id = ?", args: [slug] })).rows[0];
  if (!t) return null;
  const stored: string[] = JSON.parse(String(t.category_tags) || "[]");
  const cats = pinned[slug] && stored.includes(pinned[slug]) ? [pinned[slug]] : stored;
  // Use the category where the tool ranks best (a true statement either way, and it reads as the tool's home category).
  let best: { cat: string; rank: number; total: number } | null = null;
  for (const cat of cats) {
    const ranked = (await db.execute({ sql: "SELECT id FROM tools WHERE category_tags LIKE ? ORDER BY score DESC", args: [`%"${cat}"%`] })).rows.map((r) => String(r.id));
    const rank = ranked.indexOf(slug) + 1;
    if (rank > 0 && (!best || rank / ranked.length < best.rank / best.total)) best = { cat, rank, total: ranked.length };
  }
  if (!best) return null;
  const catName = String((await db.execute({ sql: "SELECT name FROM categories WHERE slug = ?", args: [best.cat] })).rows[0]?.name ?? best.cat);
  return { name: String(t.name), rank: best.rank, total: best.total, category: catName };
}

async function send(to: string, subject: string, text: string): Promise<string> {
  const key = readFileSync(`${process.env.HOME}/.config/secrets/brevo-api-key`, "utf8").trim();
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: { name: "Jason T.", email: "hello@agentoolrank.com" },
      replyTo: { email: "hello@agentoolrank.com", name: "Jason T." },
      to: [{ email: to }],
      subject,
      textContent: text,
      headers: { "List-Unsubscribe": "<mailto:hello@agentoolrank.com?subject=unsubscribe>" },
      tags: ["outreach"],
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`brevo ${res.status}: ${JSON.stringify(data).slice(0, 200)}`);
  return String(data.messageId ?? "");
}

if (process.argv.includes("--require-healthy")) {
  const key = readFileSync(`${process.env.HOME}/.config/secrets/brevo-api-key`, "utf8").trim();
  const stats = async (tag: string): Promise<BrevoStats> => {
    const res = await fetch(`https://api.brevo.com/v3/smtp/statistics/aggregatedReport?days=7${tag ? `&tag=${tag}` : ""}`, { headers: { "api-key": key } });
    if (!res.ok) throw new Error(`brevo stats ${res.status}`); // unknown health = don't send (the service fails and alerts)
    return res.json();
  };
  const why = sendingBlocked(await stats("outreach"), await stats(""));
  if (why) {
    console.log(`NOT SENDING: ${why}`);
    process.exit(2);
  }
  console.log("brevo health ok");
}

const today = cstDayRange(new Date(), 0);
const sentToday = sent.filter((s) => s.at >= today.from && s.at < today.to).length;
const already = new Set(sent.map((s) => s.email.toLowerCase()));
const queue = candidates.filter((c) => !already.has(c.email.toLowerCase()) && !optout.has(c.email.toLowerCase()) && !hold[c.slug] && !isGroupAddress(c.email));
const room = test ? 1 : Math.min(DAILY_CAP - sentToday, Number(arg("limit") ?? DAILY_CAP));
console.log(`candidates=${candidates.length} sent_total=${sent.length} sent_today=${sentToday} queue=${queue.length} room=${room}`);

// Shared-account guards (agentkit 10-03 17:05): skip and opt out addresses whose domain has no MX or that Brevo
// already blocked for any of the projects on this account.
async function blockedContacts(): Promise<Set<string>> {
  const key = readFileSync(`${process.env.HOME}/.config/secrets/brevo-api-key`, "utf8").trim();
  const out = new Set<string>();
  for (let offset = 0; ; offset += 100) {
    const res = await fetch(`https://api.brevo.com/v3/smtp/blockedContacts?limit=100&offset=${offset}`, { headers: { "api-key": key } });
    if (!res.ok) throw new Error(`brevo blockedContacts ${res.status}`); // unknown = don't send
    const page = ((await res.json()).contacts ?? []) as { email: string }[];
    for (const c of page) out.add(c.email.toLowerCase());
    if (page.length < 100) return out;
  }
}
const blocked = test ? new Set<string>() : await blockedContacts();
// Only a definite DNS answer (ENOTFOUND / ENODATA / empty) means "no MX" and opts the address out. Timeouts and server
// failures are retried once, then the address is skipped this round only (agentkit 10-03: new_ladar lost hi3d.ai that way).
async function mxCheck(email: string): Promise<"ok" | "none" | "unknown"> {
  const once = () => resolveMx(email.split("@")[1]).then((r) => mxVerdict({ records: r.length }), (e: NodeJS.ErrnoException) => mxVerdict({ error: e.code }));
  const v = await once();
  if (v !== "unknown") return v;
  await new Promise((r) => setTimeout(r, 2000));
  return once();
}
const optoutList = load<string[]>("optout.json", []);

let n = 0;
for (const c of queue) {
  if (n >= room) break;
  const mx = test ? "ok" : await mxCheck(c.email);
  if (mx === "unknown") {
    console.log(`skip ${c.slug}: MX lookup failed twice (temporary DNS error) — not opted out, retry next run`);
    continue;
  }
  const why = test ? null : preflightSkip(c.email, mx === "ok" ? 1 : 0, blocked);
  if (why) {
    console.log(`skip ${c.slug}: ${why} → optout`);
    if (!dryRun) {
      optoutList.push(c.email.toLowerCase());
      writeFileSync(dir + "optout.json", JSON.stringify(optoutList, null, 2));
    }
    continue;
  }
  const t = await live(c.slug);
  if (!t || t.rank < 1) { console.log(`skip ${c.slug}: not in DB / no category`); continue; }
  // One factual line about package downloads when we have the number (top registry only).
  const pkgs = await db.execute({ sql: "SELECT registry, package, downloads_30d FROM tool_packages WHERE tool_id = ? ORDER BY downloads_30d DESC", args: [c.slug] }).then((r) => r.rows, () => []);
  const top = downloadsLine(pkgs.map((r) => ({ registry: String(r.registry), package: String(r.package), downloads_30d: r.downloads_30d === null ? null : Number(r.downloads_30d) })))[0];
  const mail = outreachEmail({ owner: c.owner, slug: c.slug, ...t, ...(top && top.n >= 1000 ? { downloads: { label: top.label, pkg: top.pkg, value: top.value, n: top.n } } : {}) }, BASE);
  const to = test ?? c.email;
  if (dryRun) { console.log(`--- to ${to}\nSubject: ${mail.subject}\n${mail.text}\n`); n++; continue; }
  const id = await send(to, mail.subject, mail.text);
  console.log(`sent ${c.slug} → ${to} (${id})`);
  if (!test) {
    sent.push({ email: c.email, slug: c.slug, at: new Date().toISOString().slice(0, 19).replace("T", " "), messageId: id });
    writeFileSync(dir + "sent.json", JSON.stringify(sent, null, 2));
  }
  n++;
  await new Promise((r) => setTimeout(r, 30000)); // spread sends out
}
console.log(`done: ${n}`);
