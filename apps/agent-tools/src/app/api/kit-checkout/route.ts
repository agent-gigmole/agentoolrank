import { NextRequest } from "next/server";
import { stripe } from "@/lib/paid";
import { kitCheckoutForm } from "@/lib/kit-checkout";

// POST { src? } → { url } of a Stripe Checkout page for the Submit Kit ($29 one-time). Price is set server-side.
export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) return Response.json({ error: "Payments are not available yet." }, { status: 503 });
  let src = "";
  try {
    const body = await req.json();
    if (typeof body?.src === "string") src = body.src;
  } catch {
    // empty body is fine
  }
  try {
    const session = await stripe("checkout/sessions", { method: "POST", body: kitCheckoutForm({ src, baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://agentoolrank.com" }) });
    return Response.json({ url: session.url });
  } catch (err) {
    console.error("kit checkout error:", err);
    return Response.json({ error: "Could not start checkout, please try again." }, { status: 502 });
  }
}
