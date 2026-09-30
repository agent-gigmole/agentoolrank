import { NextRequest } from "next/server";
import { createSubmission } from "@/lib/submit-core";

const recent = new Map<string, number[]>(); // ip -> submit timestamps (per instance)

function tooMany(ip: string): boolean {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 60 * 60 * 1000);
  hits.push(now);
  recent.set(ip, hits);
  return hits.length > 5;
}

// Web form endpoint (/submit). Agents should use POST /api/v1/submissions or the MCP server.
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (tooMany(ip)) return Response.json({ error: "Too many submissions, try again later." }, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  try {
    const r = await createSubmission(body, { src: typeof body.src === "string" ? body.src : "" });
    if (r.kind === "spam") return Response.json({ ok: true, position: 1, waitDays: 1, slug: "" }); // don't tip off bots
    if (r.kind === "invalid") return Response.json({ error: r.errors.join(" ") }, { status: 400 });
    if (r.kind === "listed") return Response.json({ ok: true, alreadyListed: true, slug: r.slug });
    return Response.json({ ok: true, slug: r.slug, position: r.queue_position, waitDays: r.eta_days });
  } catch (err) {
    console.error("Submit error:", err);
    return Response.json({ error: "Something went wrong, please try again." }, { status: 500 });
  }
}
