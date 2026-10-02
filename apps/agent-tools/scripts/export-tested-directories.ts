/**
 * Export the public fields of data/directories-verified.json (built from our own submission notes) to
 * src/lib/directories-tested.json for /where-to-list. Gotchas and success signals stay private (Submit Kit);
 * our internal outcome and project names are not published.
 * Usage: bun run scripts/export-tested-directories.ts
 */
import { readFileSync, writeFileSync } from "node:fs";

const src = JSON.parse(readFileSync(new URL("../data/directories-verified.json", import.meta.url), "utf8")) as Record<string, any>;
const arr = (v: unknown) => (Array.isArray(v) ? v.filter((x) => typeof x === "string") : []);
const out = Object.values(src)
  .map((d) => ({
    domain: String(d.domain),
    free: ["yes", "no"].includes(d.free_option) ? d.free_option : "unknown",
    conditions: arr(d.free_conditions).filter((c) => c !== "none"),
    queue: typeof d.queue_wait === "string" ? d.queue_wait.slice(0, 120) : null,
    paidFrom: typeof d.paid_from_usd === "number" ? d.paid_from_usd : null,
    link: ["dofollow", "nofollow", "ugc"].includes(d.link) ? d.link : "unknown",
    login: arr(d.login),
    captcha: ["recaptcha", "hcaptcha", "turnstile", "image", "other", "none"].includes(d.captcha) ? d.captcha : "unknown",
    human: arr(d.needs_human),
    verified: String(d.last_verified ?? ""),
  }))
  .sort((a, b) => a.domain.localeCompare(b.domain));
writeFileSync(new URL("../src/lib/directories-tested.json", import.meta.url), JSON.stringify(out, null, 1) + "\n");
console.log(`exported ${out.length}`);
