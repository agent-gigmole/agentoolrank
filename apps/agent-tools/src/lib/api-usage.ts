// Portable API / MCP call log (agentkit 10-03: written so new_ladar can reuse the same table and helper when it sells
// per-call queries). One row per tool call: surface (mcp|api), tool, ok, latency, a short hash of the key if one was
// sent (never the key), the client's product token (never the full user agent or IP) and an optional source tag.
import { createHash } from "node:crypto";

export const CREATE_API_CALLS = `CREATE TABLE IF NOT EXISTS api_calls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL DEFAULT (datetime('now')),
  surface TEXT NOT NULL,
  tool TEXT NOT NULL,
  ok INTEGER NOT NULL,
  ms INTEGER NOT NULL DEFAULT 0,
  key_id TEXT NOT NULL DEFAULT '',
  client TEXT NOT NULL DEFAULT '',
  src TEXT NOT NULL DEFAULT ''
)`;

export function clientFromUserAgent(ua: string): string {
  if (!ua) return "unknown";
  if (/^Mozilla\//.test(ua)) return "browser";
  return ua.split(/\s/)[0].slice(0, 60);
}

export interface CallInput { surface: "mcp" | "api"; tool: string; ok: boolean; ms: number; key?: string; ua: string; src: string }

export function callRow(c: CallInput) {
  return {
    surface: c.surface,
    tool: c.tool.slice(0, 60),
    ok: c.ok ? 1 : 0,
    ms: Math.round(c.ms),
    key_id: c.key ? createHash("sha256").update(c.key).digest("hex").slice(0, 12) : "",
    client: clientFromUserAgent(c.ua),
    src: c.src.slice(0, 60),
  };
}

type Exec = (q: { sql: string; args: (string | number)[] }) => Promise<unknown>;
let ready = false;

/** Fire-and-forget insert; a logging failure never breaks the tool call. */
export async function recordCall(exec: Exec, c: CallInput): Promise<void> {
  try {
    if (!ready) {
      await exec({ sql: CREATE_API_CALLS, args: [] });
      await exec({ sql: "CREATE INDEX IF NOT EXISTS idx_api_calls_ts ON api_calls(ts)", args: [] });
      ready = true;
    }
    const r = callRow(c);
    await exec({ sql: "INSERT INTO api_calls (surface, tool, ok, ms, key_id, client, src) VALUES (?, ?, ?, ?, ?, ?, ?)", args: [r.surface, r.tool, r.ok, r.ms, r.key_id, r.client, r.src] });
  } catch (err) {
    console.error("api_calls insert failed:", err);
  }
}
