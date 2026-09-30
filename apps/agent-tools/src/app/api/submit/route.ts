import { db } from "@repo/db";
import { NextRequest } from "next/server";
import { validateSubmission, slugFromSubmission, estimatedWaitDays } from "@/lib/submissions";

// Additive only: created on first use, never altered here.
const CREATE_SUBMISSIONS = `CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  tagline TEXT NOT NULL,
  github_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  plan TEXT NOT NULL DEFAULT 'free' CHECK(plan IN ('free','fast','featured')),
  backlink_verified INTEGER NOT NULL DEFAULT 0,
  src TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at TEXT
)`;

const recent = new Map<string, number[]>(); // ip -> submit timestamps (per instance)

function tooMany(ip: string): boolean {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 60 * 60 * 1000);
  hits.push(now);
  recent.set(ip, hits);
  return hits.length > 5;
}

async function queuePosition(id: number): Promise<number> {
  const r = await db.execute({
    sql: "SELECT COUNT(*) AS n FROM submissions WHERE status = 'pending' AND id <= ?",
    args: [id],
  });
  return Number(r.rows[0].n);
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (tooMany(ip)) return Response.json({ error: "Too many submissions, try again later." }, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const result = validateSubmission(body);
  if (!result.ok) {
    // Pretend success to bots so they don't retry.
    if (result.spam) return Response.json({ ok: true, position: 1, waitDays: 1, slug: "" });
    return Response.json({ error: result.errors.join(" ") }, { status: 400 });
  }
  const s = result.value;
  const slug = slugFromSubmission(s);
  const src = typeof body.src === "string" ? body.src.slice(0, 200) : "";

  try {
    await db.execute(CREATE_SUBMISSIONS);

    const listed = await db.execute({ sql: "SELECT id FROM tools WHERE id = ?", args: [slug] });
    if (listed.rows.length > 0) {
      return Response.json({ ok: true, alreadyListed: true, slug });
    }

    const existing = await db.execute({ sql: "SELECT id, slug, status FROM submissions WHERE url = ?", args: [s.url] });
    let id: number;
    if (existing.rows.length > 0) {
      id = Number(existing.rows[0].id);
    } else {
      const ins = await db.execute({
        sql: "INSERT INTO submissions (slug, url, name, email, tagline, github_url, src) VALUES (?, ?, ?, ?, ?, ?, ?)",
        args: [slug, s.url, s.name, s.email, s.tagline, s.github_url, src],
      });
      id = Number(ins.lastInsertRowid);
    }
    const position = await queuePosition(id);
    return Response.json({ ok: true, slug, position, waitDays: estimatedWaitDays(position) });
  } catch (err) {
    console.error("Submit error:", err);
    return Response.json({ error: "Something went wrong, please try again." }, { status: 500 });
  }
}
