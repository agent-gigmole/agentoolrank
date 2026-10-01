// Submission review helpers for scripts/review-submissions.ts: parse the LLM verdict,
// build the tools row, detect the badge backlink, and order the queue.

export interface Review {
  decision: "approve" | "reject";
  reason: string;
  category: string;
  tagline: string;
  description: string;
  pricing: "free" | "freemium" | "paid" | "open-source";
  intelligence: Record<string, unknown>;
}

const PRICING = ["free", "freemium", "paid", "open-source"] as const;
const s = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export function parseReview(raw: string, categories: string[]): Review | null {
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return null;
  let v: Record<string, unknown>;
  try {
    v = JSON.parse(m[0]);
  } catch {
    return null;
  }
  if (v.decision !== "approve" && v.decision !== "reject") return null;
  const category = s(v.category, 60);
  const pricing = (PRICING as readonly string[]).includes(String(v.pricing)) ? (v.pricing as Review["pricing"]) : "freemium";
  const decision = v.decision === "approve" && categories.includes(category) ? "approve" : "reject";
  return {
    decision,
    reason: s(v.reason, 300) || (decision !== v.decision ? `unknown category "${category}"` : ""),
    category,
    tagline: s(v.tagline, 160),
    description: s(v.description, 1500),
    pricing,
    intelligence: typeof v.intelligence === "object" && v.intelligence !== null ? stripMetaNotes(v.intelligence as Record<string, unknown>) : {},
  };
}

export interface SubmissionRow {
  slug: string;
  name: string;
  url: string;
  github_url: string | null;
  tagline: string;
}

export function toolRowFromReview(sub: SubmissionRow, r: Review) {
  const gh = sub.github_url?.match(/github\.com\/([^/]+)\/([^/]+)/);
  return {
    id: sub.slug,
    name: sub.name,
    tagline: sub.tagline || r.tagline,
    description: r.description,
    website_url: sub.url,
    github_url: sub.github_url,
    github_owner: gh?.[1] ?? null,
    github_repo: gh?.[2] ?? null,
    category_tags: JSON.stringify([r.category]),
    source: "manual" as const,
    pricing: r.pricing,
    content_status: "complete" as const,
    intelligence: JSON.stringify(r.intelligence),
  };
}

export function hasBacklink(html: string): boolean {
  return /href=["']https?:\/\/(www\.)?agentoolrank\.com/i.test(html);
}

export function reviewOrder(a: { id: number; plan: string; backlink_verified: number }, b: { id: number; plan: string; backlink_verified: number }): number {
  const paid = (x: typeof a) => (x.plan === "free" ? 0 : 1);
  return paid(b) - paid(a) || b.backlink_verified - a.backlink_verified || a.id - b.id;
}

/** Taglines stored by older crawls were cut at 160/200 chars, often mid-word. */
export function isTruncatedTagline(t: string): boolean {
  const s = t.trim();
  return s.length >= 150 && !/[.!?。！？)\]"'”…]$/.test(s);
}

/** A raw GitHub description is only usable as a tagline if it fits; otherwise let the reviewer's tagline win. */
export function submissionTagline(desc: string): string {
  const s = desc.trim();
  return s.length <= 160 ? s : "";
}

// Older reviews sometimes wrote notes about their own evidence into product fields ("Website could not be fetched").
const META = /(website|site|readme)?\s*(content|details|text)?\s*(could not|couldn't|was not|were not) (be )?(fetched|accessed|accessible|verified)|website (details|content|text) (unavailable|not available)|no website (content|text|information)|evidence (is )?limited to|for (full|additional) (feature )?(verification|details|context|review)/i;

export function isMetaNote(s: string): boolean {
  return META.test(s);
}

export function stripMetaNotes(intel: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(intel)) out[k] = Array.isArray(v) ? v.filter((x) => typeof x !== "string" || !isMetaNote(x)) : v;
  return out;
}
