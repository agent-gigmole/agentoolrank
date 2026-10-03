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
  lines.push("Listing elsewhere too? Your agent can call recommend_directories on https://agentoolrank.com/api/mcp for launch directories worth submitting to, with the steps only a person can do (free top 10), or see them in a browser: https://agentoolrank.com/submit-kit?ref=agent-queued");
  return lines.join("\n");
}

/**
 * Response for an agent that submits a tool we already list. Whoever submits a listed tool is usually its maintainer,
 * the buyer for the featured slot, so the reply carries that offer (no review needed) and the badge, not just a link.
 */
export function listedReply(o: { baseUrl: string; slug: string; listingUrl: string; paymentsEnabled: boolean; badgeHtml: string }) {
  const featured = PLANS.featured;
  const buyUrl = `${o.baseUrl}/tool/${o.slug}?ref=agent-listed#maintainers`;
  return {
    status: "already_listed" as const,
    slug: o.slug,
    listing_url: o.listingUrl,
    badge_html: o.badgeHtml,
    submit_kit_url: `${o.baseUrl}/submit-kit?ref=agent-listed`,
    featured_offer: o.paymentsEnabled
      ? {
          price_usd: featured.amount / 100,
          featured_days: featured.featuredDays,
          what_you_get: `${featured.featuredDays} days at the top of the AgentoolRank homepage and the tool's category page. One-time payment.`,
          buy_url: buyUrl,
        }
      : null,
    message_for_human: [
      `This tool is already listed on AgentoolRank: ${o.listingUrl}`,
      "Add the badge (badge_html) to the README or website to show live GitHub stars.",
      `Listing it on other launch directories too? Which ones fit, tested by submitting our own products (top 10 free): ${o.baseUrl}/submit-kit?ref=agent-listed`,
      ...(o.paymentsEnabled ? [`Optional: feature it for ${featured.featuredDays} days on the homepage and its category page ($${featured.amount / 100}, one-time): ${buyUrl}`] : []),
    ].join("\n"),
  };
}
