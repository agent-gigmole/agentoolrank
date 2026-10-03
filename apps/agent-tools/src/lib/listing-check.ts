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

/**
 * Our backlink on a page: an <a> to agentoolrank.com (target "site"), or else to our GitHub repo (target "github":
 * MCP registries such as conduid link the repo only — the listing is live, but it is not a link to the site).
 * rel "dofollow" means the anchor had no rel.
 */
export function findBacklink(html: string): { found: boolean; rel: string | null; target: "site" | "github" | null } {
  let repo: { found: boolean; rel: string | null; target: "github" } | null = null;
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
    const rel = /\brel\s*=\s*["']([^"']*)["']/i.exec(tag)?.[1]?.trim() || "dofollow";
    if (host === "agentoolrank.com") return { found: true, rel, target: "site" };
    if (!repo && host === "github.com" && /^https?:\/\/(www\.)?github\.com\/agent-gigmole\/agentoolrank\/?(#.*)?$/i.test(href)) repo = { found: true, rel, target: "github" };
  }
  return repo ?? { found: false, rel: null, target: null };
}

/** Our own listings (written daily by scripts/check-listings.ts, read by /where-to-list). */
export const CREATE_LISTING_CHECKS = `CREATE TABLE IF NOT EXISTS listing_checks (
  domain TEXT PRIMARY KEY,
  state TEXT NOT NULL,
  url TEXT,
  rel TEXT,
  target TEXT,
  checked TEXT NOT NULL
)`;

export function ourResultLabel(r: { state: string; rel: string | null; target: string | null } | undefined): string {
  if (!r) return "—";
  if (r.state !== "live") return "Submitted, not live yet";
  if (r.target === "github") return "Live · links our GitHub";
  if (!r.rel) return "Live";
  return /nofollow|ugc|sponsored/.test(r.rel) ? "Live · nofollow" : "Live · followed link";
}
