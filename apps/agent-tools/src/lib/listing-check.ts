// Daily check of our directory listings (pipeline agentoolrank-daily): is the listing page up, and does it link to us
// with which rel? Facts only from the live page; nothing is assumed dofollow unless the anchor has no rel.
const SLUG = "agentoolrank";
const PATHS = ["tool", "tools", "product", "products", "p", "project", "listing", "ai"];

export function knownListingUrl(domain: string, detail: string): string | null {
  for (const m of detail.matchAll(/https?:\/\/[^\s（）()，,"'<>]+/g)) {
    try {
      const host = new URL(m[0]).hostname.replace(/^www\./, "");
      if (host === domain.replace(/^www\./, "")) return m[0];
    } catch {
      /* not a URL */
    }
  }
  return null;
}

export function candidateUrls(domain: string, known: string | null): string[] {
  return known ? [known] : PATHS.map((p) => `https://${domain}/${p}/${SLUG}`);
}

/** Our backlink on a page: an <a> whose href host is agentoolrank.com. rel "dofollow" means the anchor had no rel. */
export function findBacklink(html: string): { found: boolean; rel: string | null } {
  for (const m of html.matchAll(/<a\b[^>]*>/gi)) {
    const tag = m[0];
    const href = /\bhref\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    if (!href) continue;
    let host = "";
    try {
      host = new URL(href).hostname.replace(/^www\./, "");
    } catch {
      continue;
    }
    if (host !== "agentoolrank.com") continue;
    const rel = /\brel\s*=\s*["']([^"']*)["']/i.exec(tag)?.[1]?.trim();
    return { found: true, rel: rel || "dofollow" };
  }
  return { found: false, rel: null };
}
