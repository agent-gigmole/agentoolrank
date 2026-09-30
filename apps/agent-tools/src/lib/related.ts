// "Works with" relations: tool A lists B in its integrations (or B lists A), and B is not
// an alternative to A. Pure data, no LLM — used by scripts/fill-related.ts.

export interface RelatedInput {
  id: string;
  name: string;
  alternatives: string[];
  integrations: string[];
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

export function buildRelated(rows: RelatedInput[], max: number): Map<string, string[]> {
  const byName = new Map<string, string>();
  for (const r of rows) {
    byName.set(norm(r.name), r.id);
    byName.set(norm(r.id), r.id);
  }
  const alts = new Map(rows.map((r) => [r.id, new Set(r.alternatives)]));
  const links = new Map<string, string[]>(rows.map((r) => [r.id, []]));
  const add = (a: string, b: string) => {
    if (a === b || alts.get(a)?.has(b) || alts.get(b)?.has(a)) return;
    const list = links.get(a)!;
    if (!list.includes(b)) list.push(b);
  };
  for (const r of rows) {
    for (const n of r.integrations) {
      const other = byName.get(norm(n));
      if (other) {
        add(r.id, other);
        add(other, r.id);
      }
    }
  }
  for (const [id, list] of links) links.set(id, list.slice(0, max));
  return links;
}
