// Paid listing options sold on /submit. Checkout goes to Stripe (TENSO LLC account,
// statement suffix AGENTOOLRANK, metadata.site=agentoolrank for reconciliation).

export const PLANS = {
  priority: {
    amount: 900,
    name: "AgentoolRank priority review",
    description: "Your tool is reviewed within 72 hours instead of waiting in the free queue.",
    featuredDays: 0,
    reviewHours: 72,
  },
  fast: {
    amount: 1900,
    name: "AgentoolRank fast-track review",
    description: "Your tool is reviewed within 24 hours instead of waiting in the free queue.",
    featuredDays: 0,
    reviewHours: 24,
  },
  featured: {
    amount: 4900,
    name: "AgentoolRank featured listing (7 days)",
    description: "Fast-track review plus 7 days in the Featured section of the AgentoolRank homepage and at the top of your category page.",
    featuredDays: 7,
    reviewHours: 24,
  },
} as const;

export type Plan = keyof typeof PLANS;

export function isPlan(v: unknown): v is Plan {
  return v === "priority" || v === "fast" || v === "featured";
}

export function checkoutForm(o: { plan: Plan; submissionId: number; slug: string; email: string; src: string; baseUrl: string }): URLSearchParams {
  const p = PLANS[o.plan];
  const f = new URLSearchParams();
  f.set("mode", "payment");
  f.set("line_items[0][quantity]", "1");
  f.set("line_items[0][price_data][currency]", "usd");
  f.set("line_items[0][price_data][unit_amount]", String(p.amount));
  f.set("line_items[0][price_data][product_data][name]", p.name);
  f.set("branding_settings[display_name]", "AgentoolRank"); // brand on the Stripe page, not the shared account name
  f.set("line_items[0][price_data][product_data][description]", p.description);
  f.set("payment_intent_data[statement_descriptor_suffix]", "AGENTOOLRANK");
  if (o.email) f.set("customer_email", o.email); // listed-tool upgrades: Stripe asks for the email
  f.set("success_url", `${o.baseUrl}/submit/thanks?session_id={CHECKOUT_SESSION_ID}`);
  f.set("cancel_url", `${o.baseUrl}/submit?canceled=1`);
  for (const [k, v] of Object.entries({ site: "agentoolrank", submission_id: String(o.submissionId), slug: o.slug, plan: o.plan, src: o.src })) {
    f.set(`metadata[${k}]`, v);
    f.set(`payment_intent_data[metadata][${k}]`, v);
  }
  return f;
}

/** /submit structured data: listing on AgentoolRank as a Product, the free queue plus each paid plan as an Offer. */
export function listingProductJsonLd(baseUrl: string) {
  const url = `${baseUrl}/submit`;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "List an AI agent tool on AgentoolRank",
    description: "Submit an open-source AI agent tool to AgentoolRank. Free review queue, or pay once to be reviewed sooner or featured.",
    brand: { "@type": "Brand", name: "AgentoolRank" },
    url,
    offers: [
      { "@type": "Offer", name: "Free listing (review queue)", price: "0", priceCurrency: "USD", url },
      ...(["priority", "fast", "featured"] as const).map((k) => ({
        "@type": "Offer", name: PLANS[k].name, price: String(PLANS[k].amount / 100), priceCurrency: "USD", url,
      })),
    ],
  };
}
