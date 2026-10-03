import { withCallLog } from "@/lib/api-log";
import { NextRequest } from "next/server";
import { createSubmission } from "@/lib/submit-core";
import { listedReply } from "@/lib/offers";
import { badgeHtml } from "@/lib/submissions";

// Agent-friendly submission API. POST JSON:
// { url, name, tagline, email, github_url?, max_budget_usd?, deadline_days?, want_featured? }
// → queue position, ETA, every paid option with a checkout link for the human, a recommended
//   plan for the given budget/deadline, a badge snippet, and a status URL.
const CORS = { "Access-Control-Allow-Origin": "*" };
const recent = new Map<string, number[]>();

async function handlePOST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 3600_000);
  hits.push(now);
  recent.set(ip, hits);
  if (hits.length > 10) return Response.json({ error: "rate_limited", retry_after_seconds: 3600 }, { status: 429, headers: CORS });

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400, headers: CORS });
  }
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
  try {
    const r = await createSubmission(
      { url: b.url, name: b.name, tagline: b.tagline, email: b.email, github_url: b.github_url },
      { src: `api${typeof b.src === "string" ? "/" + b.src : ""}`, maxBudgetUsd: num(b.max_budget_usd), deadlineDays: num(b.deadline_days), wantFeatured: b.want_featured === true },
    );
    if (r.kind === "invalid") return Response.json({ error: "invalid_submission", details: r.errors }, { status: 400, headers: CORS });
    if (r.kind === "spam") return Response.json({ error: "invalid_submission" }, { status: 400, headers: CORS });
    if (r.kind === "listed") {
      const base = process.env.NEXT_PUBLIC_BASE_URL || "https://agentoolrank.com";
      return Response.json(listedReply({ baseUrl: base, slug: r.slug, listingUrl: r.url, paymentsEnabled: Boolean(process.env.STRIPE_SECRET_KEY), badgeHtml: badgeHtml(base, r.slug, typeof b.name === "string" ? b.name : r.slug) }), { headers: CORS });
    }
    return Response.json(
      {
        status: "queued",
        ...r,
        kind: undefined,
        next_steps: [
          "Nothing else is required for the free listing.",
          "To skip the queue, give one of the offers' checkout_url to your human to pay (card, one-time).",
          "Adding badge_html to the product's website moves a free submission up the queue.",
          "Poll status_url (daily is plenty) to see when the listing is live.",
        ],
      },
      { status: 201, headers: CORS },
    );
  } catch (err) {
    console.error("v1 submit error:", err);
    return Response.json({ error: "internal_error" }, { status: 500, headers: CORS });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: { ...CORS, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
}

export const POST = withCallLog("submit_tool", handlePOST);
