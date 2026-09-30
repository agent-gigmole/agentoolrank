import { describe, it, expect } from "vitest";
import { buildOffers, recommendPlan } from "./offers";

const base = { baseUrl: "https://agentoolrank.com", submissionId: 12, token: "tok", waitDays: 20, paymentsEnabled: true };

describe("buildOffers", () => {
  const offers = buildOffers(base);

  it("lists free plus three paid tiers, cheapest first", () => {
    expect(offers.map((o) => [o.plan, o.price_usd])).toEqual([["free", 0], ["priority", 9], ["fast", 19], ["featured", 49]]);
  });

  it("gives each paid tier a lazy checkout URL for the human to pay", () => {
    expect(offers[0].checkout_url).toBeNull();
    expect(offers[2].checkout_url).toBe("https://agentoolrank.com/api/v1/submissions/12/checkout?plan=fast&token=tok");
  });

  it("states review time in days", () => {
    expect(offers.find((o) => o.plan === "free")?.live_within_days).toBe(20);
    expect(offers.find((o) => o.plan === "priority")?.live_within_days).toBe(3);
    expect(offers.find((o) => o.plan === "featured")?.featured_days).toBe(7);
  });

  it("only offers free when payments are off", () => {
    expect(buildOffers({ ...base, paymentsEnabled: false }).map((o) => o.plan)).toEqual(["free"]);
  });
});

describe("recommendPlan", () => {
  const offers = buildOffers(base);
  it("picks the cheapest tier that meets the deadline within budget", () => {
    expect(recommendPlan(offers, { maxBudgetUsd: 50, deadlineDays: 30 })?.plan).toBe("free");
    expect(recommendPlan(offers, { maxBudgetUsd: 50, deadlineDays: 5 })?.plan).toBe("priority");
    expect(recommendPlan(offers, { maxBudgetUsd: 50, deadlineDays: 1 })?.plan).toBe("fast");
  });
  it("wants featured only when asked for visibility", () => {
    expect(recommendPlan(offers, { maxBudgetUsd: 100, wantFeatured: true })?.plan).toBe("featured");
  });
  it("returns null when nothing fits", () => {
    expect(recommendPlan(offers, { maxBudgetUsd: 5, deadlineDays: 1 })).toBeNull();
  });
  it("defaults to free with no constraints", () => {
    expect(recommendPlan(offers, {})?.plan).toBe("free");
  });
});
