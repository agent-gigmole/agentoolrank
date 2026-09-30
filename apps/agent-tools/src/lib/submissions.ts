// Maker submissions: validation, slug + badge helpers for /submit.

export const FREE_REVIEWS_PER_DAY = 3;

export interface SubmissionInput {
  url?: unknown;
  name?: unknown;
  email?: unknown;
  tagline?: unknown;
  github_url?: unknown;
  website?: unknown; // honeypot: humans never see or fill it
}

export interface Submission {
  url: string;
  name: string;
  email: string;
  tagline: string;
  github_url: string | null;
}

export type ValidationResult =
  | { ok: true; value: Submission }
  | { ok: false; errors: string[]; spam?: boolean };

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

function normalizeUrl(raw: string): string | null {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    u.hash = "";
    return u.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

const GITHUB_REPO = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/i;

export function validateSubmission(input: SubmissionInput): ValidationResult {
  if (str(input.website)) return { ok: false, errors: ["spam"], spam: true };

  const errors: string[] = [];
  const url = normalizeUrl(str(input.url));
  if (!url) errors.push("Enter your product's website (https://…).");

  const name = str(input.name);
  if (!name || name.length > 80) errors.push("Name is required (max 80 characters).");

  const email = str(input.email).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Enter a valid email so we can tell you when you're live.");

  const tagline = str(input.tagline);
  if (!tagline || tagline.length > 160) errors.push("Tagline is required (max 160 characters).");

  const githubRaw = str(input.github_url).replace(/\/$/, "").replace(/\.git$/, "");
  const github_url = githubRaw ? githubRaw : null;
  if (github_url && !GITHUB_REPO.test(github_url)) errors.push("GitHub URL must look like https://github.com/owner/repo.");

  if (errors.length > 0 || !url) return { ok: false, errors };
  return { ok: true, value: { url, name, email, tagline, github_url } };
}

export function slugFromSubmission(s: { name: string; github_url: string | null }): string {
  const base = s.github_url ? s.github_url.split("/").pop()! : s.name;
  return base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function badgeHtml(baseUrl: string, slug: string, name: string): string {
  return `<a href="${baseUrl}/tool/${slug}" target="_blank"><img src="${baseUrl}/api/badge/${slug}" alt="${name.replace(/"/g, "&quot;")} on AgentoolRank" height="40" /></a>`;
}

export function estimatedWaitDays(position: number): number {
  return Math.max(1, Math.ceil(position / FREE_REVIEWS_PER_DAY));
}
