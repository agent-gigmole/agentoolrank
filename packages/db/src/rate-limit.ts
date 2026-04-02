// Simple in-memory rate limiter per IP
// Resets on deploy (Vercel cold start). Good enough for cost protection.

const store = new Map<string, { count: number; resetAt: number }>();

const DAILY_LIMIT = 20; // max AI requests per IP per day
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

// Cleanup stale entries every 100 calls
let callCount = 0;
function cleanup() {
  callCount++;
  if (callCount % 100 !== 0) return;
  const now = Date.now();
  for (const [key, val] of store) {
    if (now > val.resetAt) store.delete(key);
  }
}

export function checkRateLimit(ip: string): { ok: boolean; remaining: number } {
  cleanup();
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, remaining: DAILY_LIMIT - 1 };
  }

  if (entry.count >= DAILY_LIMIT) {
    return { ok: false, remaining: 0 };
  }

  entry.count++;
  return { ok: true, remaining: DAILY_LIMIT - entry.count };
}
