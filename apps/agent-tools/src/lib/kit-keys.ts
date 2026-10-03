// Submit Kit access keys: we store only the SHA-256 of each key, with a 30-day expiry (the update window sold).
import { createHash, randomBytes } from "node:crypto";
import { db } from "@repo/db";

const CREATE = `CREATE TABLE IF NOT EXISTS kit_keys (
  key_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL DEFAULT '',
  stripe_session TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
)`;
let ready = false;
async function ensure() {
  if (!ready) { await db.execute(CREATE); ready = true; }
}

export const newKitKey = () => `ark_kit_${randomBytes(24).toString("base64url")}`;
export const hashKitKey = (key: string) => createHash("sha256").update(key).digest("hex");

/** Issue a key valid for `days`; returns the plaintext key once (it is never stored). */
export async function issueKitKey(o: { email: string; stripeSession: string; days?: number }): Promise<string> {
  await ensure();
  const key = newKitKey();
  await db.execute({
    sql: "INSERT INTO kit_keys (key_hash, email, stripe_session, expires_at) VALUES (?, ?, ?, datetime('now', ?))",
    args: [hashKitKey(key), o.email, o.stripeSession, `+${o.days ?? 30} days`],
  });
  return key;
}

export async function kitKeyValid(key: string): Promise<boolean> {
  if (!/^ark_kit_[A-Za-z0-9_-]{32,}$/.test(key)) return false;
  try {
    await ensure();
    const r = await db.execute({ sql: "SELECT 1 FROM kit_keys WHERE key_hash = ? AND expires_at > datetime('now')", args: [hashKitKey(key)] });
    return r.rows.length > 0;
  } catch {
    return false;
  }
}

/**
 * Fulfil a paid Submit Kit Checkout Session once: issue a key and record the payment.
 * Returns the plaintext key only on the first call for that session; later calls get { alreadyIssued: true }.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fulfillKitSession(s: any): Promise<{ key?: string; alreadyIssued?: boolean; email: string }> {
  await ensure();
  const session = String(s.id);
  const email = String(s.customer_details?.email ?? s.customer_email ?? "");
  const done = await db.execute({ sql: "SELECT 1 FROM kit_keys WHERE stripe_session = ?", args: [session] });
  if (done.rows.length > 0) return { alreadyIssued: true, email };
  const key = await issueKitKey({ email, stripeSession: session });
  await db.execute(`CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT, submission_id INTEGER NOT NULL, plan TEXT NOT NULL, amount_cents INTEGER NOT NULL,
    stripe_session TEXT NOT NULL UNIQUE, src TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now')))`);
  await db.execute({
    sql: "INSERT OR IGNORE INTO payments (submission_id, plan, amount_cents, stripe_session, src) VALUES (0, 'submit_kit', ?, ?, ?)",
    args: [Number(s.amount_total ?? 2900), session, String(s.metadata?.src ?? "")],
  });
  return { key, email };
}
