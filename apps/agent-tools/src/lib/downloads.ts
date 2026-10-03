import { compareSlug } from "./alternatives";
// npm / PyPI monthly downloads for tools that publish a package (weekly-ops). Package names come from the tool's own
// repo (package.json / pyproject.toml / setup.py), never typed by hand, and only count if the registry metadata points
// back at the same GitHub repo, so a same-named package from someone else is never credited.
export function githubRepo(url: string | null | undefined): { owner: string; repo: string } | null {
  const m = /github\.com\/([^/\s]+)\/([^/\s#?]+)/i.exec(url ?? "");
  return m ? { owner: m[1], repo: m[2].replace(/\.git$/, "") } : null;
}

export function npmNameFromPackageJson(text: string): string | null {
  try {
    const j = JSON.parse(text);
    return !j.private && typeof j.name === "string" && j.name ? j.name : null;
  } catch {
    return null;
  }
}

export function pypiNameFromPyproject(text: string): string | null {
  for (const section of ["project", "tool.poetry"]) {
    const start = text.search(new RegExp(`^\\[${section.replace(".", "\\.")}\\]\\s*$`, "m"));
    if (start < 0) continue;
    const body = text.slice(start).split(/\n\[/)[0];
    const m = /^\s*name\s*=\s*["']([^"']+)["']/m.exec(body);
    if (m) return m[1];
  }
  return null;
}

export function pypiNameFromSetupPy(text: string): string | null {
  return /\bname\s*=\s*["']([A-Za-z0-9._-]+)["']/.exec(text)?.[1] ?? null;
}

export function repoMatches(url: string | undefined, owner: string, repo: string): boolean {
  const r = githubRepo(url);
  return !!r && r.owner.toLowerCase() === owner.toLowerCase() && r.repo.toLowerCase() === repo.toLowerCase();
}

/** Registry names worth trying; each is only kept if its metadata links back to the tool's repo (repoMatches). */
export function candidateNames(t: { manifest: string | null; repo: string; id: string; name: string }, registry: "npm" | "pypi"): string[] {
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, "-");
  const out: string[] = [];
  const add = (s: string | null | undefined) => {
    if (s && !out.includes(s)) out.push(s);
  };
  add(t.manifest);
  add(t.manifest?.replace(/-(workspace|monorepo|root)$/i, ""));
  add(norm(t.repo));
  add(t.id);
  add(norm(t.name));
  if (registry === "npm") {
    add(`@${norm(t.repo)}/core`);
    add(norm(t.repo).replace(/-?js$/, "")); // "langchainjs" publishes "langchain"
  }
  return out.filter((s) => s.length > 1);
}

const compact = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : String(n));

/** Detail-page rows for "monthly downloads" (only packages with a number; links go to the registry page). */
export function downloadsLine(rows: { registry: string; package: string; downloads_30d: number | null }[]) {
  return rows
    .filter((r) => typeof r.downloads_30d === "number")
    .map((r) => ({
      label: r.registry === "pypi" ? "PyPI" : "npm",
      pkg: r.package,
      n: r.downloads_30d as number,
      value: compact(r.downloads_30d as number),
      url: r.registry === "pypi" ? `https://pypi.org/project/${r.package}/` : `https://www.npmjs.com/package/${r.package}`,
    }));
}

export interface DownloadRow { id: string; name: string; stars: number | null; registry: string; package: string; downloads_30d: number | null; categories?: string[] }

/** /downloads leaderboard: one row per tool, npm + PyPI summed, plus downloads per GitHub star (usage vs attention). */
export function rankByDownloads(rows: DownloadRow[], category?: string) {
  const by = new Map<string, { id: string; name: string; stars: number | null; total: number; packages: ReturnType<typeof downloadsLine> }>();
  for (const r of rows) {
    if (typeof r.downloads_30d !== "number") continue;
    if (category && !(r.categories ?? []).includes(category)) continue;
    const t = by.get(r.id) ?? { id: r.id, name: r.name, stars: r.stars, total: 0, packages: [] };
    t.total += r.downloads_30d;
    t.packages.push(...downloadsLine([r]));
    by.set(r.id, t);
  }
  return [...by.values()]
    .map((t) => ({
      ...t,
      packages: t.packages.sort((x, y) => y.n - x.n),
      perStar: t.stars ? Math.round(t.total / t.stars) : null,
    }))
    .sort((a, b) => b.total - a.total);
}

export const compactCount = compact;

/** npm + PyPI downloads for one tool (compare pages); null when no registry count is known. */
export function totalDownloads(rows: { downloads_30d: number | null }[]): number | null {
  const known = rows.filter((r) => typeof r.downloads_30d === "number");
  return known.length ? known.reduce((s, r) => s + (r.downloads_30d as number), 0) : null;
}

/** One sentence for /alternatives: who is actually used most (downloads) versus who gets the most attention (stars). */
export function usageVerdict(tools: { name: string; stars: number | null; downloads: number | null }[]): string | null {
  const counted = tools.filter((t) => typeof t.downloads === "number");
  if (counted.length < 2) return null;
  const used = [...counted].sort((a, b) => (b.downloads as number) - (a.downloads as number))[0];
  const starred = [...tools].sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0))[0];
  const head = `By package downloads ${used.name} is the most used here (${compact(used.downloads as number)} in the last 30 days)`;
  return starred.name === used.name ? `${head}, and it also has the most GitHub stars.` : `${head}, even though ${starred.name} has the most GitHub stars.`;
}

/** "Used more than starred": highest downloads per GitHub star, among tools with ≥100k downloads in 30 days. */
export function usedMoreThanStarred<T extends { total: number; perStar: number | null }>(ranked: T[], limit = 10, floor = 100_000): T[] {
  return ranked.filter((t) => t.perStar !== null && t.total >= floor).sort((a, b) => (b.perStar as number) - (a.perStar as number)).slice(0, limit);
}

/** A /downloads/<category> page exists only with at least this many counted tools (thin-content floor). */
export const DOWNLOAD_CATEGORY_MIN = 3;

/** Category slug → counted tools, for every category that gets a page. Page, sitemap and links all use this. */
export function downloadCategorySlugs(rows: DownloadRow[], slugs: string[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const s of slugs) {
    const n = rankByDownloads(rows, s).length;
    if (n >= DOWNLOAD_CATEGORY_MIN) out.set(s, n);
  }
  return out;
}

/** Compare-page slugs ("a-vs-b", slugs sorted) for the top-N most-downloaded tools within each category. */
export function downloadPairs(rows: DownloadRow[], categories: string[], topN = 6): string[] {
  const out = new Set<string>();
  for (const c of categories) {
    const top = rankByDownloads(rows, c).slice(0, topN).map((t) => t.id);
    for (let i = 0; i < top.length; i++) for (let j = i + 1; j < top.length; j++) out.add(compareSlug(top[i], top[j]));
  }
  return [...out];
}
