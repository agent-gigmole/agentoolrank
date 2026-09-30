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
  return cut.slice(0, Math.max(cut.lastIndexOf(" "), 0) || max).replace(/[.,;:\s-]+$/, "");
}

export function toolTitle(name: string, tagline: string, githubStars: number | null): string {
  const suffix = githubStars ? ` · ${stars(githubStars)}` : "";
  const room = 70 - name.length - 2 - suffix.length;
  const desc = tagline && room > 15 ? shortTagline(tagline, room) : "";
  return desc ? `${name}: ${desc}${suffix}` : `${name} — Open-Source AI Agent Tool: Stats & Alternatives${suffix}`;
}

export function compareTitle(a: string, b: string, year: number): string {
  return `${a} vs ${b} (${year}): GitHub Stats, Features & Which to Choose`;
}
