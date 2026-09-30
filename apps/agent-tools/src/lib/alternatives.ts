// Alternatives generation helpers: a cheap TF-IDF pre-filter narrows 460+ tools to a
// shortlist, then an LLM picks the ones that do the same job (see scripts/generate-alternatives.ts).

const STOPWORDS = new Set(
  "a an and are as at be by for from in into is it its of on or that the this to with your you via can using use based built".split(" "),
);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+#]+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

type Vector = Map<string, number>;

function tfidfVectors(docs: Array<{ id: string; text: string }>): Map<string, Vector> {
  const tokenized = docs.map((d) => ({ id: d.id, tokens: tokenize(d.text) }));
  const df = new Map<string, number>();
  for (const { tokens } of tokenized) for (const t of new Set(tokens)) df.set(t, (df.get(t) ?? 0) + 1);

  const vectors = new Map<string, Vector>();
  for (const { id, tokens } of tokenized) {
    const v: Vector = new Map();
    for (const t of tokens) v.set(t, (v.get(t) ?? 0) + 1);
    let norm = 0;
    for (const [t, tf] of v) {
      const w = tf * Math.log(1 + docs.length / (df.get(t) ?? 1));
      v.set(t, w);
      norm += w * w;
    }
    norm = Math.sqrt(norm) || 1;
    for (const [t, w] of v) v.set(t, w / norm);
    vectors.set(id, v);
  }
  return vectors;
}

function cosine(a: Vector, b: Vector): number {
  const [small, large] = a.size < b.size ? [a, b] : [b, a];
  let sum = 0;
  for (const [t, w] of small) sum += w * (large.get(t) ?? 0);
  return sum;
}

/** Ids of the `limit` tools most similar to `id`, most similar first. */
export function rankCandidates(id: string, docs: Array<{ id: string; text: string }>, limit: number): string[] {
  const vectors = tfidfVectors(docs);
  const target = vectors.get(id);
  if (!target) return [];
  return docs
    .filter((d) => d.id !== id)
    .map((d) => ({ id: d.id, score: cosine(target, vectors.get(d.id)!) }))
    .sort((x, y) => y.score - x.score)
    .slice(0, limit)
    .map((x) => x.id);
}

/** Extract `{"alternatives": [...]}` from an LLM reply, keeping only known ids. */
export function parseAlternativesResponse(raw: string, allowed: Set<string>, selfId: string): string[] {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return [];
  let ids: unknown;
  try {
    ids = (JSON.parse(match[0]) as { alternatives?: unknown }).alternatives;
  } catch {
    return [];
  }
  if (!Array.isArray(ids)) return [];
  const out: string[] = [];
  for (const id of ids) {
    if (typeof id === "string" && id !== selfId && allowed.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

/** Compare URLs put the alphabetically smaller id first (see getComparisonPairs). */
export function compareSlug(a: string, b: string): string {
  return a < b ? `${a}-vs-${b}` : `${b}-vs-${a}`;
}

export function alternativesTitle(name: string, count: number, year: number): string {
  return count === 1
    ? `Best ${name} Alternative in ${year} (Open Source)`
    : `${count} Best ${name} Alternatives in ${year} (Open Source)`;
}

/** True when the tagline already opens with the tool's name ("Claude Code is ..."), so we don't print it twice. */
export function taglineMentionsName(name: string, tagline: string): boolean {
  return tagline.trim().toLowerCase().startsWith(name.trim().toLowerCase());
}

/** Canonical "a-vs-b" slugs for each tool and its first k alternatives (tools given in priority order). */
export function pairsFromAlternatives(tools: Array<{ id: string; alternatives: string[] }>, k: number): string[] {
  const out: string[] = [];
  for (const t of tools) {
    for (const alt of t.alternatives.slice(0, k)) {
      const slug = compareSlug(t.id, alt);
      if (!out.includes(slug)) out.push(slug);
    }
  }
  return out;
}

export function categoryTitle(category: string, count: number, year: number): string {
  return `${count >= 3 ? `${count} ` : ""}Best Open-Source ${category} in ${year} (Ranked by GitHub Activity)`;
}
