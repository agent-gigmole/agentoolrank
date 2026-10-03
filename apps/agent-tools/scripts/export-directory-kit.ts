/**
 * Build src/lib/directory-kit-data.json for the recommend_directories MCP tool (Submit Kit).
 * Sources: data/directories-verified.json (our own notes, LLM-structured) and the shared submission log
 * (~/data/backlinks/directory-log.csv) for the "don't submit" list. Purchased columbus fields (DR, visits, their
 * dofollow labels) are never read or written here.
 * Usage: bun run scripts/export-directory-kit.ts
 */
import { readFileSync, writeFileSync } from "node:fs";

const sites = Object.values(JSON.parse(readFileSync(new URL("../data/directories-verified.json", import.meta.url), "utf8"))) as any[];
const arr = (v: unknown) => (Array.isArray(v) ? v.filter((x) => typeof x === "string") : []);
const outSites = sites.map((d) => ({
  domain: String(d.domain),
  accepts: arr(d.accepts),
  language: typeof d.language === "string" ? d.language : "en",
  free: ["yes", "no"].includes(d.free_option) ? d.free_option : "unknown",
  conditions: arr(d.free_conditions).filter((c) => c !== "none"),
  queue: typeof d.queue_wait === "string" ? d.queue_wait.slice(0, 140) : null,
  paidFrom: typeof d.paid_from_usd === "number" ? d.paid_from_usd : null,
  link: ["dofollow", "nofollow", "ugc"].includes(d.link) ? d.link : "unknown",
  login: arr(d.login),
  captcha: typeof d.captcha === "string" ? d.captcha : "unknown",
  human: arr(d.needs_human),
  tips: arr(d.gotchas).slice(0, 4),
  success: typeof d.success_signal === "string" ? d.success_signal.slice(0, 160) : null,
  outcome: String(d.outcome ?? ""),
  verified: String(d.last_verified ?? ""),
}));

// "Don't submit" reasons that hold for everyone (never project-specific "not a fit").
const REASONS: Array<[string, RegExp, string]> = [
  ["paid_only", /仅付费|只收费|付费才|paid only|only paid|提交走定价页|实为付费/i, "Free submission is not really available (paid only)."],
  ["badge_or_backlink", /须挂.*徽章|需挂.*徽章|免费档.*徽章|须.*回链|backlink to our site is required|只收徽章/i, "Free tier requires displaying their badge or a backlink."],
  ["vote_gate", /投票|互评|刷票|vote/i, "Free listing requires voting for or reviewing other products."],
  ["credentials", /Stripe 只读 key|交凭证|凭证（硬闸）/i, "Requires handing over account credentials (e.g. a Stripe key)."],
  ["new_domain_reject", /Untrustworthy|秒拒|自动拒/i, "Auto-rejects new domains within minutes."],
  ["form_broken", /CF7 status=failed|表单报错|提交页 404|站方故障|发信故障|signup 500|502/i, "Submission form was broken when we tried."],
  ["queue_years", /2,602|排满至 ?2027|约 1 年|180 天/i, "Free queue is a year or longer."],
  ["hijacked_page", /博彩|gambling|赌场|casino/i, "Submit page showed gambling spam (likely compromised)."],
];
const lines = readFileSync(`${process.env.HOME}/data/backlinks/directory-log.csv`, "utf8").split("\n").slice(1);
const byDomain = new Map<string, string[]>();
for (const l of lines) { const d = l.split(",")[0]; if (d) byDomain.set(d, [...(byDomain.get(d) ?? []), l]); }
const accepted = new Set(outSites.filter((s) => ["submitted", "listed"].includes(s.outcome)).map((s) => s.domain));
const avoid: Array<{ domain: string; reason: string; detail: string }> = [];
for (const [domain, ls] of byDomain) {
  if (accepted.has(domain)) continue;
  const text = ls.join("\n");
  const hit = REASONS.find(([, re]) => re.test(text));
  if (hit) avoid.push({ domain, reason: hit[0], detail: hit[2] });
}
avoid.sort((a, b) => a.reason.localeCompare(b.reason) || a.domain.localeCompare(b.domain));
const out = { generated: new Date().toISOString().slice(0, 10), sites: outSites.filter((s) => s.outcome !== "skipped"), avoid };
writeFileSync(new URL("../src/lib/directory-kit-data.json", import.meta.url), JSON.stringify(out, null, 1) + "\n");
console.log(`sites=${out.sites.length} avoid=${avoid.length}`, Object.entries(avoid.reduce((m: any, a) => ((m[a.reason] = (m[a.reason] ?? 0) + 1), m), {})));
