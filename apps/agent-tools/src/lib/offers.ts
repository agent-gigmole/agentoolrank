// Machine-readable listing offers for AI agents submitting on behalf of their humans.
// No retention popups: every option (including the cheap one) is listed up front, and the
// agent can ask us to recommend the cheapest tier that meets its budget and deadline.
import { PLANS, type Plan } from "./plans";

export interface Offer {
  plan: "free" | Plan;
  price_usd: number;
  live_within_days: number;
  featured_days: number;
  what_you_get: string;
  checkout_url: string | null; // open in a browser to pay (a human usually does this step)
}

export function buildOffers(o: { baseUrl: string; submissionId: number; token: string; waitDays: number; paymentsEnabled: boolean }): Offer[] {
  const free: Offer = {
    plan: "free",
    price_usd: 0,
    live_within_days: o.waitDays,
    featured_days: 0,
    what_you_get: "Permanent listing with live GitHub stats, alternatives and comparison pages, llms.txt/MCP visibility, and a badge. Reviewed in queue order; showing our badge on your site moves you up.",
    checkout_url: null,
  };
  if (!o.paymentsEnabled) return [free];
  const paid = (Object.keys(PLANS) as Plan[]).map((plan) => ({
    plan,
    price_usd: PLANS[plan].amount / 100,
    live_within_days: Math.ceil(PLANS[plan].reviewHours / 24),
    featured_days: PLANS[plan].featuredDays,
    what_you_get: `Everything in free. ${PLANS[plan].description} One-time payment; full refund if not approved.`,
    checkout_url: `${o.baseUrl}/api/v1/submissions/${o.submissionId}/checkout?plan=${plan}&token=${o.token}`,
  }));
  return [free, ...paid].sort((a, b) => a.price_usd - b.price_usd);
}

export function recommendPlan(offers: Offer[], c: { maxBudgetUsd?: number; deadlineDays?: number; wantFeatured?: boolean }): Offer | null {
  const fits = offers.filter(
    (o) =>
      o.price_usd <= (c.maxBudgetUsd ?? Infinity) &&
      o.live_within_days <= (c.deadlineDays ?? Infinity) &&
      (!c.wantFeatured || o.featured_days > 0),
  );
  return fits.sort((a, b) => a.price_usd - b.price_usd)[0] ?? null;
}

/** One paragraph an agent can forward to its human as-is: the free result plus every optional paid upgrade. */
export function messageForHuman(name: string, offers: Offer[]): string {
  const free = offers.find((o) => o.plan === "free");
  const paid = offers.filter((o) => o.price_usd > 0);
  const lines = [`${name} was submitted to AgentoolRank for free. It will go live after review in about ${free?.live_within_days ?? 14} day${(free?.live_within_days ?? 14) === 1 ? "" : "s"}, with a permanent page showing live GitHub stats, alternatives and comparisons.`];
  if (paid.length) {
    lines.push("Optional one-time upgrades (full refund if not approved):");
    for (const o of paid) {
      const extra = o.featured_days ? ` plus ${o.featured_days} days on the homepage` : "";
      lines.push(`- $${o.price_usd}: live within ${o.live_within_days} day${o.live_within_days > 1 ? "s" : ""}${extra}. Pay: ${o.checkout_url}`);
    }
  }
  return lines.join("\n");
}
