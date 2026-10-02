import { createHash } from "node:crypto";

// Localized pages: shared helpers for hreflang, translation parsing and deterministic checks.
// Pages are added per language only where a reviewed translation exists (see scripts/translate-tools.ts).
const BASE = "https://agentoolrank.com";

export const LANGS = ["zh", "ja"] as const;
export type Lang = (typeof LANGS)[number];

/** Canonical + hreflang for a page whose English path is `path`; every version lists all versions (self included) + x-default. */
export function localizedAlternates(path: string, available: readonly string[], current: "en" | Lang) {
  const url = (l: string) => (l === "en" ? `${BASE}${path}` : `${BASE}/${l}${path}`);
  if (available.length === 0) return { canonical: url(current) };
  const languages: Record<string, string> = { en: url("en") };
  for (const l of available) languages[l] = url(l);
  languages["x-default"] = url("en");
  return { canonical: url(current), languages };
}

export interface ToolTranslation {
  tagline: string;
  description: string;
  key_differentiator: string;
  capabilities: string[];
  best_for: string[];
  not_for: string[];
  limitations: string[];
}

const LIST_KEYS = ["capabilities", "best_for", "not_for", "limitations"] as const;

export function parseToolTranslation(text: string): ToolTranslation | null {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  let o: Record<string, unknown>;
  try {
    o = JSON.parse(m[0]);
  } catch {
    return null;
  }
  if (typeof o.tagline !== "string" || !o.tagline.trim()) return null;
  if (typeof o.description !== "string") return null;
  const out: ToolTranslation = {
    tagline: o.tagline.trim(),
    description: o.description.trim(),
    key_differentiator: typeof o.key_differentiator === "string" ? o.key_differentiator.trim() : "",
    capabilities: [], best_for: [], not_for: [], limitations: [],
  };
  for (const k of LIST_KEYS) {
    const v = o[k] ?? [];
    if (!Array.isArray(v) || v.some((x) => typeof x !== "string")) return null;
    out[k] = (v as string[]).map((s) => s.trim()).filter(Boolean);
  }
  return out;
}

/** Every number in the source (100, 3.5, 2026) must survive translation unchanged. */
export function numbersPreserved(src: string, dst: string): boolean {
  const nums = src.match(/\d+(?:[.,]\d+)?/g) ?? [];
  return nums.every((n) => dst.includes(n));
}

// Common English words that should never survive in a CJK translation (product names and acronyms are fine).
const LEFTOVER_WORDS = /(?:^|[^A-Za-z])(the|and|with|for|from|that|this|which|your|our|one|two|three|four|five|six|seven|eight|nine|ten|hundred|thousand|million|only|also|more|most|than|into|over|under|about|between|through)(?=[^A-Za-z]|$)/i;

/** True when the translation still has a run of 4+ English words, or a single common English word (ignoring known names). */
export function residualEnglish(dst: string, names: string[]): boolean {
  let s = dst;
  for (const n of names) s = s.split(n).join(" ");
  return /\b[A-Za-z][A-Za-z'-]*(?:\s+[A-Za-z][A-Za-z'-]*){3,}\b/.test(s) || LEFTOVER_WORDS.test(s);
}

export interface SourceRow { id: string; name: string; tagline: string; description: string; intelligence: string }

/** The English fields a translation is made from (tagline, description, intelligence lists). */
export function translationSource(r: SourceRow): ToolTranslation {
  let intel: Record<string, unknown> = {};
  try { intel = JSON.parse(r.intelligence || "{}"); } catch { /* keep empty */ }
  const list = (k: string) => (Array.isArray(intel[k]) ? (intel[k] as unknown[]).filter((x): x is string => typeof x === "string") : []);
  return {
    tagline: r.tagline, description: r.description,
    key_differentiator: typeof intel.key_differentiator === "string" ? intel.key_differentiator : "",
    capabilities: list("capabilities"), best_for: list("best_for"), not_for: list("not_for"), limitations: list("limitations"),
  };
}

/** Changes whenever the English source changes; stored with each translation so stale ones get redone. */
export function sourceHash(src: ToolTranslation): string {
  return createHash("sha1").update(JSON.stringify(src)).digest("hex");
}
