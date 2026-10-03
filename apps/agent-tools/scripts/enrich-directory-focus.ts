/**
 * Add `accepts` (what kind of product each directory lists) to data/directories-verified.json, judged from the
 * domain name and OUR OWN submission notes only (never columbus fields). Resumable; skips sites that already have it.
 * Usage: bun run scripts/enrich-directory-focus.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { llm } from "./llm";

const F = new URL("../data/directories-verified.json", import.meta.url).pathname;
const LOG = `${process.env.HOME}/data/backlinks/directory-log.csv`;
const data = JSON.parse(readFileSync(F, "utf8")) as Record<string, any>;
const log = readFileSync(LOG, "utf8").split("\n");
const KINDS = ["ai_tools", "mcp_servers", "dev_tools", "saas", "startups_general", "open_source_only", "regional"];
let n = 0;
for (const [domain, d] of Object.entries(data)) {
  if (Array.isArray(d.accepts)) continue;
  const notes = log.filter((l) => l.startsWith(domain + ",")).join("\n").slice(0, 3000);
  const raw = await llm(`Which kinds of products does the website directory ${domain} list? Use the domain name and these notes from our own submissions.
Notes:
${notes}
Answer with JSON only: {"accepts":[subset of ${JSON.stringify(KINDS)}],"language":"en|fr|zh|ja|other"}. "startups_general" means any product or website. Use "regional" only if it is limited to a country or language.`, { maxTokens: 120, temperature: 0 });
  const m = raw.match(/\{[\s\S]*\}/);
  try {
    const v = JSON.parse(m![0]);
    d.accepts = (v.accepts ?? []).filter((k: string) => KINDS.includes(k));
    d.language = typeof v.language === "string" ? v.language : "en";
  } catch { d.accepts = []; d.language = "en"; }
  if (++n % 20 === 0) { writeFileSync(F, JSON.stringify(data, null, 1)); console.log(`progress ${n}`); }
}
writeFileSync(F, JSON.stringify(data, null, 1));
console.log(`enriched ${n}`);
