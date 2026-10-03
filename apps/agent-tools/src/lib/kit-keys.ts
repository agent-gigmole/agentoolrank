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
