import { NextRequest } from "next/server";
import { db } from "@repo/db";
import { checkRateLimit } from "@repo/db/rate-limit";
import { issueApiKey } from "@/lib/api-keys";

// POST /api/keys → { key } shown once. No account, no email; only the key hash is stored (lib/api-keys).
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(`apikey:${ip}`).ok) return Response.json({ error: "Too many keys today, try again tomorrow." }, { status: 429 });
  let body: { label?: unknown; src?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body is fine */
  }
  try {
    const key = await issueApiKey((q) => db.execute(q), {
      prefix: "ark",
      label: typeof body.label === "string" ? body.label : "",
      src: typeof body.src === "string" ? body.src : "web",
    });
    return Response.json({ key });
  } catch (err) {
    console.error("api key issue failed:", err);
    return Response.json({ error: "Could not create a key, please try again." }, { status: 500 });
  }
}
