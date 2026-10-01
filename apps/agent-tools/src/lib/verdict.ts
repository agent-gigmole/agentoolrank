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
