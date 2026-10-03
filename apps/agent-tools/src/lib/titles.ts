// Search-result titles: say what the tool is and show social proof (stars), within ~70 chars.
function stars(n: number): string {
  return n >= 1000 ? `${Math.round(n / 1000)}k★` : `${n}★`;
}

export function shortTagline(tagline: string, max: number): string {
  const clean = tagline
    .replace(/[\p{Extended_Pictographic}️]/gu, "")
    .replace(/[*_`#>\[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.!?:;,\s]+$/, "");
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  let out = cut.slice(0, Math.max(cut.lastIndexOf(" "), 0) || max).replace(/[.,;:\s-]+$/, "");
  while (DANGLING.test(out)) out = out.replace(DANGLING, "").replace(/[.,;:\s-]+$/, "");
  return out;
}

const DANGLING = /\s+(and|or|the|for|with|to|of|a|an|in|on|that|which|by|your)$/i;

function withoutLeadingName(name: string, tagline: string): string {
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const t = tagline.replace(new RegExp(`^\\s*${esc}\\s+(is|are)\\s+(an?\\s+|the\\s+)?`, "i"), "");
  return t === tagline ? t : t.charAt(0).toUpperCase() + t.slice(1);
}

export function toolTitle(name: string, tagline: string, githubStars: number | null, downloads30d?: number | null): string {
  tagline = withoutLeadingName(name, tagline);
  // Big libraries also show monthly npm + PyPI downloads (searchers compare usage); ≥1M only, so small numbers don't read as weak.
  const dl = downloads30d && downloads30d >= 1_000_000 ? ` · ${Math.round(downloads30d / 1e6)}M/mo` : "";
  const suffix = (githubStars ? ` · ${stars(githubStars)}` : "") + dl;
  const room = 70 - name.length - 2 - suffix.length;
  let desc = tagline && room > 15 ? shortTagline(tagline, room) : "";
  while (DANGLING.test(desc)) desc = desc.replace(DANGLING, "");
  return desc ? `${name}: ${desc}${suffix}` : `${name} — Open-Source AI Agent Tool: Stats & Alternatives${suffix}`;
}

export function compareTitle(a: string, b: string, year: number): string {
  return `${a} vs ${b} (${year}): GitHub Stats, Features & Which to Choose`;
}

/** Meta descriptions: keep within ~160 chars, cut at a word boundary. */
export function clampDescription(s: string, max = 160): string {
  const clean = s.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[.,;:\s-]+$/, "") + "…";
}

export function toolDescription(t: { name: string; tagline: string; stars: number | null; commits90: number | null; alternatives: string[] }): string {
  const parts = [`${t.name}: ${shortTagline(withoutLeadingName(t.name, t.tagline), 90)}.`];
  const facts = [t.stars != null ? `${stars(t.stars).replace("★", "")} GitHub stars` : "", t.commits90 != null ? `${t.commits90} commits in 90 days` : ""].filter(Boolean);
  if (facts.length) parts.push(`${facts.join(", ")}.`);
  if (t.alternatives.length) {
    const a = t.alternatives.slice(0, 3);
    parts.push(`Compare with ${a.length > 1 ? `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}` : a[0]}.`);
  }
  return clampDescription(parts.join(" "));
}
