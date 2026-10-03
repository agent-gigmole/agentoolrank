// Shared credits logic for per-call pricing (agentkit 10-03 22:20: ai-directory builds it, new_ladar reuses it; one
// implementation, each project passes its own prices). Not wired to payments yet: ai-directory turns it on only if the
// 10-18 review triggers (≥10 keys or ≥200 keyed calls). Tables follow api-keys.ts / api-usage.ts (key_hash, no PII).
export interface Pricing { dailyFree: number; costs: Record<string, number>; defaultCost?: number }
export type Charge = { ok: true; fromFree: number; fromBalance: number } | { ok: false; short: number };

/** Pure decision: today's free allowance first, then the paid balance; refuse with the shortfall otherwise. */
export function decideCharge(c: { tool: string; usedToday: number; balance: number }, p: Pricing): Charge {
  const cost = p.costs[c.tool] ?? p.defaultCost ?? 1;
  if (cost <= 0) return { ok: true, fromFree: 0, fromBalance: 0 };
  const freeLeft = Math.max(0, p.dailyFree - c.usedToday);
  const fromFree = Math.min(freeLeft, cost);
  const fromBalance = cost - fromFree;
  if (fromBalance > c.balance) return { ok: false, short: fromBalance - c.balance };
  return { ok: true, fromFree, fromBalance };
}

export const CREATE_API_CREDITS = `CREATE TABLE IF NOT EXISTS api_credits (
  key_hash TEXT PRIMARY KEY,
  balance INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;
