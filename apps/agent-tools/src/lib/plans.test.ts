import { describe, it, expect } from "vitest";
import { PLANS, checkoutForm, isPlan } from "./plans";

describe("PLANS", () => {
  it("prices fast at $19 and featured at $49, in cents", () => {
    expect(PLANS.fast.amount).toBe(1900);
    expect(PLANS.featured.amount).toBe(4900);
    expect(PLANS.featured.featuredDays).toBe(7);
    expect(PLANS.priority.amount).toBe(900);
    expect(PLANS.priority.reviewHours).toBe(72);
  });
  it("isPlan guards input", () => {
    expect(isPlan("fast")).toBe(true);
    expect(isPlan("priority")).toBe(true);
    expect(isPlan("free")).toBe(false);
    expect(isPlan(undefined)).toBe(false);
  });
});

describe("checkoutForm", () => {
  const f = checkoutForm({ plan: "featured", submissionId: 7, slug: "acme", email: "a@b.co", src: "x/social", baseUrl: "https://agentoolrank.com" });
  it("builds a one-time payment with our descriptor suffix and metadata", () => {
    expect(f.get("mode")).toBe("payment");
    expect(f.get("line_items[0][price_data][unit_amount]")).toBe("4900");
    expect(f.get("line_items[0][price_data][currency]")).toBe("usd");
    expect(f.get("payment_intent_data[statement_descriptor_suffix]")).toBe("AGENTOOLRANK");
    expect(f.get("metadata[site]")).toBe("agentoolrank");
    expect(f.get("metadata[submission_id]")).toBe("7");
    expect(f.get("metadata[plan]")).toBe("featured");
    expect(f.get("metadata[src]")).toBe("x/social");
    expect(f.get("customer_email")).toBe("a@b.co");
  });
  it("returns to a thanks page carrying the session id", () => {
    expect(f.get("success_url")).toBe("https://agentoolrank.com/submit/thanks?session_id={CHECKOUT_SESSION_ID}");
    expect(f.get("cancel_url")).toBe("https://agentoolrank.com/submit?canceled=1");
  });
});
