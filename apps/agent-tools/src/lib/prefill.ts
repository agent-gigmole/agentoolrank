// Submit form prefill: from a GitHub repo's public metadata (name, description, homepage). Fewer fields to type before
// the free submission, which is the top of the paid-plan funnel. Only fills empty fields; the user can edit everything.
export interface RepoJson { name: string; description: string | null; homepage: string | null; html_url: string }

export function prefillFromRepo(r: RepoJson) {
  const tagline = fitTagline(
    (r.description ?? "")
      .replace(/\p{Extended_Pictographic}/gu, "")
      .replace(/\s+/g, " ")
      .trim(),
  );
  const home = (r.homepage ?? "").trim();
  return { name: r.name, tagline, url: /^https?:\/\//.test(home) ? home : r.html_url, github_url: r.html_url };
}

/** ≤160 chars: the whole text if it fits, else the leading sentence(s) that fit, else cut at the last word boundary. */
function fitTagline(t: string): string {
  if (t.length <= 160) return t;
  const head = t.slice(0, 161);
  const sentence = head.match(/^.*[.!?](?=\s)/s)?.[0];
  if (sentence && sentence.length >= 40 && sentence.length <= 160) return sentence;
  const cut = head.lastIndexOf(" ");
  return head.slice(0, cut > 0 ? cut : 160).replace(/[\s,;:–-]+$/, "");
}
