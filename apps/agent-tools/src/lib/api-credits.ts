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

/** Storage is behind this interface, so the rules above are shared verbatim and each project writes its own adapter
 *  (ai-directory: SQLite/libsql below; new_ladar: Postgres). Day = the project's billing day string, e.g. "2026-10-03". */
export interface CreditStore {
  usedToday(keyHash: string, day: string): Promise<number>;
  balance(keyHash: string): Promise<number>;
  apply(keyHash: string, day: string, fromFree: number, fromBalance: number): Promise<void>;
}

export async function chargeCall(store: CreditStore, keyHash: string, tool: string, day: string, p: Pricing): Promise<Charge> {
  const c = decideCharge({ tool, usedToday: await store.usedToday(keyHash, day), balance: await store.balance(keyHash) }, p);
  if (c.ok && (c.fromFree > 0 || c.fromBalance > 0)) await store.apply(keyHash, day, c.fromFree, c.fromBalance);
  return c;
}

/** In-memory store for tests and dry runs. */
export function memoryStore(balances: Record<string, number> = {}): CreditStore {
  const used = new Map<string, number>();
  const bal = new Map(Object.entries(balances));
  return {
    usedToday: async (k, d) => used.get(`${k}|${d}`) ?? 0,
    balance: async (k) => bal.get(k) ?? 0,
    apply: async (k, d, free, paid) => {
      used.set(`${k}|${d}`, (used.get(`${k}|${d}`) ?? 0) + free);
      bal.set(k, (bal.get(k) ?? 0) - paid);
    },
  };
}

export const CREATE_API_CREDIT_USAGE = `CREATE TABLE IF NOT EXISTS api_credit_usage (
  key_hash TEXT NOT NULL,
  day TEXT NOT NULL,
  free_used INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (key_hash, day)
)`;

type Exec = (q: { sql: string; args: (string | number)[] }) => Promise<{ rows: Record<string, unknown>[] }>;

/** SQLite / libsql adapter (ai-directory). Balance decrements are guarded so they can't go below zero. */
export function sqliteStore(exec: Exec): CreditStore {
  return {
    usedToday: async (k, d) => Number((await exec({ sql: "SELECT free_used FROM api_credit_usage WHERE key_hash = ? AND day = ?", args: [k, d] })).rows[0]?.free_used ?? 0),
    balance: async (k) => Number((await exec({ sql: "SELECT balance FROM api_credits WHERE key_hash = ?", args: [k] })).rows[0]?.balance ?? 0),
    apply: async (k, d, free, paid) => {
      if (free > 0) await exec({ sql: "INSERT INTO api_credit_usage (key_hash, day, free_used) VALUES (?, ?, ?) ON CONFLICT(key_hash, day) DO UPDATE SET free_used = free_used + excluded.free_used", args: [k, d, free] });
      if (paid > 0) await exec({ sql: "UPDATE api_credits SET balance = balance - ?, updated_at = datetime('now') WHERE key_hash = ? AND balance >= ?", args: [paid, k, paid] });
    },
  };
}
