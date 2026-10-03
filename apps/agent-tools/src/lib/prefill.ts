// Submit form prefill: from a GitHub repo's public metadata (name, description, homepage). Fewer fields to type before
// the free submission, which is the top of the paid-plan funnel. Only fills empty fields; the user can edit everything.
export interface RepoJson { name: string; description: string | null; homepage: string | null; html_url: string }

export function prefillFromRepo(r: RepoJson) {
  const tagline = (r.description ?? "")
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
  const home = (r.homepage ?? "").trim();
  return { name: r.name, tagline, url: /^https?:\/\//.test(home) ? home : r.html_url, github_url: r.html_url };
}
