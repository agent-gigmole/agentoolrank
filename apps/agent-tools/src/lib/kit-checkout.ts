// Submit Kit checkout: a one-time $29 Stripe payment, separate from listing plans (metadata.product=submit_kit).
import type { StripeSessionLike } from "./reconcile";
import { KIT_PRICE_USD } from "./directory-kit";

export const KIT_AMOUNT_CENTS = KIT_PRICE_USD * 100;

export function kitCheckoutForm(o: { src: string; baseUrl: string }): URLSearchParams {
  const f = new URLSearchParams();
  f.set("mode", "payment");
  f.set("line_items[0][quantity]", "1");
  f.set("line_items[0][price_data][currency]", "usd");
  f.set("line_items[0][price_data][unit_amount]", String(KIT_AMOUNT_CENTS));
  f.set("line_items[0][price_data][product_data][name]", "AgentoolRank Submit Kit (30 days)");
  // Top of the Stripe page shows our brand instead of the shared account name (agentkit checkout-brand; receipts unchanged).
  f.set("branding_settings[display_name]", "AgentoolRank");
  f.set("line_items[0][price_data][product_data][description]", "Full recommend_directories list: 30 directories plus the don't-submit list with reasons, updated for 30 days.");
  f.set("payment_intent_data[statement_descriptor_suffix]", "AGENTOOLRANK");
  f.set("success_url", `${o.baseUrl}/submit-kit/thanks?session_id={CHECKOUT_SESSION_ID}`);
  f.set("cancel_url", `${o.baseUrl}/submit-kit?canceled=1`);
  for (const [k, v] of Object.entries({ site: "agentoolrank", product: "submit_kit", src: o.src.slice(0, 200) })) {
    f.set(`metadata[${k}]`, v);
    f.set(`payment_intent_data[metadata][${k}]`, v);
  }
  return f;
}

export function isPaidKitSession(s: StripeSessionLike): boolean {
  return s.payment_status === "paid" && s.metadata?.site === "agentoolrank" && s.metadata?.product === "submit_kit";
}
