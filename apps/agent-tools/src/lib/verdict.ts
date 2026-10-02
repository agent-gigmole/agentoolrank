// "Short answer" bullets at the top of /compare pages — every sentence derived from tracked data.
import type { Tool } from "@repo/db/schema";
import { staleness } from "./staleness";
import { shortTagline } from "./titles";

const n = (x: number) => Math.round(x).toLocaleString("en-US");
const FREE = new Set(["free", "open-source"]);
const forWhat = (tagline: string) => {
  const s = shortTagline(tagline.split(/(?<=[.!?])\s/)[0], 110);
  return s ? s.charAt(0).toLowerCase() + s.slice(1) + "." : "";
};

export function compareVerdict(a: Tool, b: Tool, now: Date): string[] {
  const out: string[] = [];
  const [sa, sb] = [staleness(a.last_commit_date, now), staleness(b.last_commit_date, now)];
  if (sa.stale !== sb.stale && a.last_commit_date && b.last_commit_date) {
    const [old, live, s] = sa.stale ? [a, b, sa] : [b, a, sb];
    const activity = live.commit_count_90d ? ` (${n(live.commit_count_90d)} commits in the last 90 days)` : "";
    out.push(`${old.name} has had no commit in ${s.months} months; ${live.name} is actively maintained${activity}.`);
  }
  const [va, vb] = [a.star_velocity_30d ?? 0, b.star_velocity_30d ?? 0];
  if (Math.max(va, vb) > 0 && Math.max(va, vb) >= 1.5 * Math.min(va, vb)) {
    const [hi, lo, vh, vl] = va > vb ? [a, b, va, vb] : [b, a, vb, va];
    out.push(`${hi.name} is growing faster: +${n(vh)} GitHub stars in the last 30 days vs +${n(vl)} for ${lo.name}.`);
  }
  if (a.pricing !== b.pricing && !(FREE.has(a.pricing) && FREE.has(b.pricing))) out.push(`${a.name} is ${a.pricing}; ${b.name} is ${b.pricing}.`);
  const [fa, fb] = [forWhat(a.tagline), forWhat(b.tagline)];
  if (fa && fb) out.push(`Pick ${a.name} for: ${fa} Pick ${b.name} for: ${fb}`);
  return out;
}

const list = (names: string[]) => (names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`);

/** Short answer for /alternatives pages; `alts` are ordered by closeness of match. */
export function alternativesVerdict(tool: Tool, alts: Tool[], now: Date): string[] {
  if (alts.length === 0) return [];
  const out = [`Closest match to ${tool.name}: ${alts[0].name}.`];
  const active = [...alts].sort((x, y) => (y.commit_count_90d ?? 0) - (x.commit_count_90d ?? 0))[0];
  if (active.commit_count_90d) out.push(`Most actively developed: ${active.name} (${n(active.commit_count_90d)} commits in the last 90 days).`);
  const growing = [...alts].sort((x, y) => (y.star_velocity_30d ?? 0) - (x.star_velocity_30d ?? 0))[0];
  if ((growing.star_velocity_30d ?? 0) >= 1) out.push(`Fastest growing: ${growing.name} (+${n(growing.star_velocity_30d!)} GitHub stars in the last 30 days).`);
  const stale = alts.filter((a) => staleness(a.last_commit_date, now).stale).map((a) => a.name);
  if (stale.length) out.push(`No commit in 6+ months: ${list(stale.slice(0, 4))}${stale.length > 4 ? ` and ${stale.length - 4} more` : ""}.`);
  return out;
}

const k = (x: number) => (x >= 1000 ? `${(x / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(x));
const GENERIC = "GitHub activity, pricing, pros & cons side by side, refreshed daily.";

/** Meta description for /compare pages: star counts plus the first data-driven verdict that fits in 160 chars. */
export function compareDescription(a: Tool, b: Tool, now: Date): string {
  let unit = " GitHub stars";
  const label = (t: Tool) => {
    if (t.github_stars === null || t.github_stars === undefined) return t.name;
    const s = `${t.name} (${k(t.github_stars)}${unit})`;
    unit = "";
    return s;
  };
  const head = `${label(a)} vs ${label(b)}: `;
  const facts = compareVerdict(a, b, now).filter((s) => !s.startsWith("Pick "));
  const options = [...facts.map((f) => `${head}${f} Live stats and which to pick.`), ...facts.map((f) => head + f), head + GENERIC];
  const fit = options.find((o) => o.length <= 160);
  if (fit) return fit;
  const cut = options[options.length - 1].slice(0, 157);
  return cut.slice(0, cut.lastIndexOf(" ")) + "...";
}
