import { db } from "@repo/db";
import { NextRequest } from "next/server";
import { checkoutForm, isPlan } from "@/lib/plans";
import { stripe } from "@/lib/paid";

// POST { slug, plan } → { url } of a Stripe Checkout page. Price is decided here, never by the client.
export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) return Response.json({ error: "Payments are not available yet." }, { status: 503 });
  let body: { slug?: unknown; plan?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!isPlan(body.plan) || typeof body.slug !== "string") return Response.json({ error: "Invalid plan" }, { status: 400 });

  const r = await db.execute({
    sql: "SELECT id, slug, email, src FROM submissions WHERE slug = ? AND status != 'rejected' ORDER BY id DESC LIMIT 1",
    args: [body.slug.slice(0, 100)],
  });
  let sub = r.rows[0] as unknown as { id: number; slug: string; email: string; src: string } | undefined;
  if (!sub && body.plan === "featured") {
    // Already-listed tool (no submission): maintainers can buy a featured slot from the tool page.
    const listed = await db.execute({ sql: "SELECT id FROM tools WHERE id = ?", args: [body.slug.slice(0, 100)] });
    if (listed.rows.length > 0) sub = { id: 0, slug: body.slug, email: "", src: typeof (body as { src?: unknown }).src === "string" ? String((body as { src?: unknown }).src).slice(0, 200) : "" };
  }
  if (!sub) return Response.json({ error: "Submit your tool first." }, { status: 404 });

  try {
    const session = await stripe("checkout/sessions", {
      method: "POST",
      body: checkoutForm({
        plan: body.plan,
        submissionId: Number(sub.id),
        slug: sub.slug,
        email: sub.email,
        src: sub.src ?? "",
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://agentoolrank.com",
      }),
    });
    return Response.json({ url: session.url });
  } catch (err) {
    console.error("checkout error:", err);
    return Response.json({ error: "Could not start checkout, please try again." }, { status: 502 });
  }
}
