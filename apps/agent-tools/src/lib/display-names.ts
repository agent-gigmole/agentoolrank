// Many tools were imported with their GitHub repo name ("claude-code") as display name.
// These helpers support scripts/generate-display-names.ts, which asks an LLM for the official name.

/** Lowercase repo-style names ("claude-code", "llama.cpp", "n8n") need a proper display name. */
export function needsDisplayName(name: string): boolean {
  return /^[a-z0-9._-]+$/.test(name);
}

export function parseDisplayNames(raw: string, ids: Set<string>): Record<string, string> {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    return {};
  }
  if (typeof parsed !== "object" || parsed === null) return {};
  const out: Record<string, string> = {};
  for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (!ids.has(id) || typeof value !== "string") continue;
    const name = value.trim();
    if (name && name.length <= 60 && !/[\n\r]/.test(name)) out[id] = name;
  }
  return out;
}
