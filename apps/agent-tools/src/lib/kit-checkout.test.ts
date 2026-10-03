import { describe, it, expect } from "vitest";
import { kitCheckoutForm, isPaidKitSession, KIT_AMOUNT_CENTS } from "./kit-checkout";

describe("kitCheckoutForm", () => {
  const f = kitCheckoutForm({ src: "mcp", baseUrl: "https://agentoolrank.com" });
  it("charges $29 once, in USD, server-side", () => {
    expect(KIT_AMOUNT_CENTS).toBe(2900);
    expect(f.get("mode")).toBe("payment");
    expect(f.get("line_items[0][price_data][unit_amount]")).toBe("2900");
    expect(f.get("line_items[0][price_data][currency]")).toBe("usd");
  });
  it("tags the session so reconciliation can tell it from listing payments", () => {
    expect(f.get("metadata[site]")).toBe("agentoolrank");
    expect(f.get("metadata[product]")).toBe("submit_kit");
    expect(f.get("metadata[plan]")).toBeNull();
    expect(f.get("metadata[src]")).toBe("mcp");
  });
  it("returns to the kit thanks page with the session id", () => {
    expect(f.get("success_url")).toBe("https://agentoolrank.com/submit-kit/thanks?session_id={CHECKOUT_SESSION_ID}");
    expect(f.get("cancel_url")).toBe("https://agentoolrank.com/submit-kit?canceled=1");
  });
});

describe("isPaidKitSession", () => {
  it("accepts only paid agentoolrank submit_kit sessions", () => {
    expect(isPaidKitSession({ id: "cs_1", payment_status: "paid", metadata: { site: "agentoolrank", product: "submit_kit" } })).toBe(true);
    expect(isPaidKitSession({ id: "cs_2", payment_status: "unpaid", metadata: { site: "agentoolrank", product: "submit_kit" } })).toBe(false);
    expect(isPaidKitSession({ id: "cs_3", payment_status: "paid", metadata: { site: "pixtidy", product: "submit_kit" } })).toBe(false);
    expect(isPaidKitSession({ id: "cs_4", payment_status: "paid", metadata: { site: "agentoolrank", plan: "fast" } })).toBe(false);
  });
});

describe("checkout branding (agentkit checkout-brand)", () => {
  it("shows AgentoolRank at the top of the Stripe page instead of the shared account name", () => {
    expect(kitCheckoutForm({ src: "x", baseUrl: "https://agentoolrank.com" }).get("branding_settings[display_name]")).toBe("AgentoolRank");
  });
});
