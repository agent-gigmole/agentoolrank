/**
 * Build our own verified directory dataset from what our projects actually did on each site
 * (~/data/backlinks/directory-log.csv `detail` notes only — never the purchased columbus fields like DR/visits).
 * Only sites where at least one project reached a concrete outcome (submitted / badge / captcha / retry / x-verify)
 * are included. The LLM extracts structured fields from our notes; anything not stated becomes "unknown".
 * Output: data/directories-verified.json (feeds /where-to-list, the data article and the Submit Kit).
 * Usage: bun run scripts/build-directory-dataset.ts [--limit=N]
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { llm } from "./llm";

const LOG = `${process.env.HOME}/data/backlinks/directory-log.csv`;
const OUT = new URL("../data/directories-verified.json", import.meta.url).pathname;
const OUTCOMES = new Set(["submitted", "live", "badge", "captcha", "retry", "x-verify"]);
const limit = Number(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? Infinity);

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else if (c !== "\r") cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows;
  return body.filter((r) => r.length >= head.length).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}

const log = parseCsv(readFileSync(LOG, "utf8"));
const byDomain = new Map<string, Record<string, string>[]>();
for (const r of log) byDomain.set(r.domain, [...(byDomain.get(r.domain) ?? []), r]);
const domains = [...byDomain.entries()].filter(([, rs]) => rs.some((r) => OUTCOMES.has(r.result))).slice(0, limit);

const done: Record<string, unknown> = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};
console.log(`log domains=${byDomain.size} with outcome=${domains.length} cached=${Object.keys(done).length}`);

const PROMPT = (domain: string, notes: string) => `You extract facts about a website directory (where makers submit their product) from OUR OWN submission notes.
Use ONLY what the notes state. If a field is not stated, use "unknown" (or [] / null). Notes are in Chinese and English.
Later notes override earlier ones. Never guess.

Domain: ${domain}
Notes (date | project | result | detail):
${notes}

Return only JSON:
{"free_option":"yes|no|unknown",
 "free_conditions":[subset of "badge","backlink","x_post","vote_or_review_others","queue","call","none"],
 "queue_wait":"short text or null",
 "paid_from_usd":number|null,
 "link":"dofollow|nofollow|ugc|unknown"   (only if the notes say we checked it, e.g. "实测"/"站内链接 rel=..."/"csv 原记 dofollow 不准"; otherwise unknown),
 "login":[subset of "none","email_password","email_code","magic_link","google","github","x","other"],
 "captcha":"none|recaptcha|hcaptcha|turnstile|image|other|unknown",
 "needs_human":[subset of "captcha","real_name","phone","payment","x_post","video_call","email_inbox"],
 "gotchas":["max 3 short English tips a submitter's agent must know, from the notes"],
 "success_signal":"short English text or null",
 "outcome":"submitted|listed|blocked_captcha|blocked_badge|blocked_paid|broken|skipped|retry"}`;

let n = 0;
for (const [domain, rs] of domains) {
  if (done[domain]) continue;
  const notes = rs.map((r) => `${r.date} | ${r.project} | ${r.result} | ${r.detail}`).join("\n").slice(0, 6000);
  const raw = await llm(PROMPT(domain, notes), { maxTokens: 700, temperature: 0 });
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) { console.log(`${domain}: unparseable`); continue; }
  try {
    done[domain] = { domain, ...JSON.parse(m[0]), last_verified: rs.map((r) => r.date).sort().pop(), projects: [...new Set(rs.map((r) => r.project))] };
  } catch { console.log(`${domain}: bad json`); continue; }
  if (++n % 10 === 0) { writeFileSync(OUT, JSON.stringify(done, null, 1)); console.log(`progress ${n}`); }
}
writeFileSync(OUT, JSON.stringify(done, null, 1));
console.log(`done +${n} total=${Object.keys(done).length} -> ${OUT}`);
