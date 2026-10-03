import { withCallLog } from "@/lib/api-log";
import { NextRequest } from "next/server";
import { db } from "@repo/db";
import { checkToken } from "@/lib/submit-core";
import { checkoutForm, isPlan } from "@/lib/plans";
import { stripe } from "@/lib/paid";

// Payment link handed from an agent to its human: creates a Stripe Checkout session on click
// (so unused offers never create sessions) and redirects there.
async function handleGET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plan = req.nextUrl.searchParams.get("plan");
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://agentoolrank.com";
  if (!process.env.STRIPE_SECRET_KEY) return new Response("Payments are not available yet.", { status: 503 });
  if (!isPlan(plan) || !(await checkToken(Number(id), token))) return new Response("Invalid or expired link.", { status: 404 });

  const r = await db.execute({ sql: "SELECT id, slug, email, src, status FROM submissions WHERE id = ?", args: [Number(id)] });
  const sub = r.rows[0] as unknown as { id: number; slug: string; email: string; src: string; status: string } | undefined;
  if (!sub || sub.status === "rejected") return new Response("This submission can't be upgraded.", { status: 404 });

  try {
    const session = await stripe("checkout/sessions", {
      method: "POST",
      body: checkoutForm({ plan, submissionId: Number(sub.id), slug: sub.slug, email: sub.email, src: sub.src ?? "", baseUrl }),
    });
    return Response.redirect(session.url, 303);
  } catch (err) {
    console.error("agent checkout error:", err);
    return new Response("Could not start checkout, please try again.", { status: 502 });
  }
}

export const GET = withCallLog("submission_checkout", handleGET);
