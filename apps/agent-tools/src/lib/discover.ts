// Candidate selection for scripts/expand-tools.ts (GitHub search results → repos worth judging).
export interface GhRepo {
  full_name: string;
  stargazers_count: number;
  fork: boolean;
  archived: boolean;
  description: string | null;
  html_url: string;
  homepage: string | null;
}

const NOT_TOOLS = /(^|[-_/])(awesome|list|papers?|tutorials?|course|examples?|cookbook|prompts?|roadmap|interview|book)([-_]|$)/i;

export function pickCandidates(repos: GhRepo[], listed: Set<string>, max: number): GhRepo[] {
  const seen = new Set<string>();
  const out: GhRepo[] = [];
  for (const r of [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count)) {
    const key = r.full_name.toLowerCase();
    if (seen.has(key) || listed.has(key) || r.fork || r.archived || NOT_TOOLS.test(r.full_name.split("/")[1])) continue;
    seen.add(key);
    out.push(r);
    if (out.length >= max) break;
  }
  return out;
}
