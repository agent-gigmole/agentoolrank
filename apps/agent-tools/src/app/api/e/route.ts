import { db } from "@repo/db";
import { NextRequest } from "next/server";
import { parseEvent, isBotUserAgent } from "@/lib/events";

// Additive only: created on first use, never altered here.
const CREATE_EVENTS = `CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL DEFAULT (datetime('now')),
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  ref TEXT NOT NULL DEFAULT '',
  src TEXT NOT NULL DEFAULT '',
  sid TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT ''
)`;

let tableReady = false;

export async function POST(req: NextRequest) {
  if (isBotUserAgent(req.headers.get("user-agent") ?? "")) return new Response(null, { status: 204 });

  let body: unknown;
  try {
    body = JSON.parse(await req.text()); // sendBeacon posts text/plain
  } catch {
    return new Response(null, { status: 400 });
  }
  const e = parseEvent(body);
  if (!e) return new Response(null, { status: 400 });

  try {
    if (!tableReady) {
      await db.execute(CREATE_EVENTS);
      await db.execute("CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts)");
      tableReady = true;
    }
    await db.execute({
      sql: "INSERT INTO events (name, path, ref, src, sid, country) VALUES (?, ?, ?, ?, ?, ?)",
      args: [e.name, e.path, e.ref, e.src, e.sid, req.headers.get("x-vercel-ip-country") ?? ""],
    });
  } catch (err) {
    console.error("event insert failed:", err);
  }
  return new Response(null, { status: 204 });
}
