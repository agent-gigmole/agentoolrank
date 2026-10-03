// Free API keys, minimal version (credits plan step 2, 10-03): one click issues a key, shown once; only its sha256 is
// stored. No account, no email (nothing personal collected before the privacy page is approved). Keys identify callers
// in api_calls (key_id = first 12 hex of the hash) and will carry credits later if the 10-18 review says so.
// Portable: new_ladar can reuse this file and table as is.
import { createHash, randomBytes } from "node:crypto";

export const CREATE_API_KEYS = `CREATE TABLE IF NOT EXISTS api_keys (
  key_hash TEXT PRIMARY KEY,
  key_id TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  src TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const newApiKey = (prefix: string) => `${prefix}_${randomBytes(24).toString("base64url")}`;
export const hashApiKey = (key: string) => createHash("sha256").update(key).digest("hex");
export const keyId = (key: string) => hashApiKey(key).slice(0, 12);

type Exec = (q: { sql: string; args: (string | number)[] }) => Promise<{ rows: unknown[] }>;

export async function issueApiKey(exec: Exec, o: { prefix: string; label?: string; src?: string }): Promise<string> {
  await exec({ sql: CREATE_API_KEYS, args: [] });
  const key = newApiKey(o.prefix);
  await exec({ sql: "INSERT INTO api_keys (key_hash, key_id, label, src) VALUES (?, ?, ?, ?)", args: [hashApiKey(key), keyId(key), (o.label ?? "").slice(0, 80), (o.src ?? "").slice(0, 60)] });
  return key;
}
