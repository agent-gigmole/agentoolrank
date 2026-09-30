// Which paid "featured" slots are running right now (SQLite datetime strings are UTC).
export interface FeaturedRow {
  slug: string;
  starts_at: string;
  ends_at: string;
}

const utc = (s: string) => new Date(s.replace(" ", "T") + (s.endsWith("Z") ? "" : "Z")).getTime();

export function activeFeatured(rows: FeaturedRow[], now: Date, max = 6): string[] {
  const t = now.getTime();
  const out: string[] = [];
  for (const r of [...rows].sort((a, b) => utc(b.starts_at) - utc(a.starts_at))) {
    if (utc(r.starts_at) <= t && t < utc(r.ends_at) && !out.includes(r.slug)) out.push(r.slug);
  }
  return out.slice(0, max);
}
