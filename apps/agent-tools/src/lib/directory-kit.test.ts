import { describe, it, expect } from "vitest";
import { recommendDirectories, tierOf, type KitSite, type KitData } from "./directory-kit";
import realData from "./directory-kit-data.json";

const now = new Date("2026-10-03T00:00:00Z");
const s = (o: Partial<KitSite>): KitSite => ({ domain: "x.com", accepts: ["ai_tools"], language: "en", free: "yes", conditions: [], queue: null, paidFrom: null, link: "unknown", login: ["none"], captcha: "unknown", human: [], tips: ["tip"], success: "Submitted!", outcome: "submitted", verified: "2026-10-02", ...o });
const data: KitData = {
  generated: "2026-10-03",
  sites: [
    s({ domain: "auto-ai.com" }),
    s({ domain: "dofollow-ai.com", link: "dofollow" }),
    s({ domain: "inbox.com", human: ["email_inbox"] }),
    s({ domain: "captcha.com", human: ["captcha"], captcha: "recaptcha" }),
    s({ domain: "google-only.com", login: ["google"] }),
    s({ domain: "badge.com", conditions: ["badge"] }),
    s({ domain: "paid.com", free: "no", paidFrom: 49 }),
    s({ domain: "mcp.com", accepts: ["mcp_servers"] }),
    s({ domain: "general.com", accepts: ["startups_general"] }),
    s({ domain: "fr.com", language: "fr" }),
    s({ domain: "old.com", verified: "2026-08-01" }),
  ],
  avoid: [{ domain: "bad.com", reason: "paid_only", detail: "Free submission is not really available (paid only)." }],
};

describe("tierOf", () => {
  it("sorts sites into auto / manual / avoid", () => {
    expect(tierOf(s({}))).toBe("auto");
    expect(tierOf(s({ human: ["email_inbox"] }))).toBe("manual");
    expect(tierOf(s({ human: ["captcha"] }))).toBe("manual");
    expect(tierOf(s({ login: ["google"] }))).toBe("manual");
    expect(tierOf(s({ conditions: ["badge"] }))).toBe("avoid");
    expect(tierOf(s({ free: "no" }))).toBe("avoid");
    expect(tierOf(s({ outcome: "blocked_captcha" }))).toBe("avoid");
  });
});

describe("recommendDirectories", () => {
  it("free mode returns at most 10 matching sites, no avoid list, and says how to get the rest", () => {
    const r = recommendDirectories(data, { productType: "ai_tool", full: false, now });
    expect(r.sites.length).toBeLessThanOrEqual(10);
    expect(r.avoid).toBeUndefined();
    expect(r.upgrade).toMatch(/\$29/);
    // People reading the agent's answer can open the same free list on the web for their product type.
    expect(r.upgrade).toContain("https://agentoolrank.com/submit-kit?type=");
  });
  it("keeps avoid-tier sites out of the recommendations and lists the avoid reasons in full mode", () => {
    const r = recommendDirectories(data, { productType: "ai_tool", full: true, now });
    const domains = r.sites.map((x) => x.domain);
    expect(domains).not.toContain("badge.com");
    expect(domains).not.toContain("paid.com");
    expect(r.avoid?.map((a) => a.domain)).toEqual(expect.arrayContaining(["bad.com", "badge.com", "paid.com"]));
  });
  it("ranks auto before manual and measured dofollow first within a tier", () => {
    const r = recommendDirectories(data, { productType: "ai_tool", full: true, now });
    expect(r.sites[0].domain).toBe("dofollow-ai.com");
    const tiers = r.sites.map((x) => x.tier);
    expect(tiers.indexOf("manual")).toBeGreaterThan(tiers.lastIndexOf("auto"));
  });
  it("matches by product type and language", () => {
    const mcp = recommendDirectories(data, { productType: "mcp_server", full: true, now }).sites.map((x) => x.domain);
    expect(mcp).toContain("mcp.com");
    const ai = recommendDirectories(data, { productType: "ai_tool", full: true, now }).sites.map((x) => x.domain);
    expect(ai).not.toContain("mcp.com");
    expect(ai).toContain("general.com");
    expect(ai).not.toContain("fr.com");
    expect(recommendDirectories(data, { productType: "ai_tool", full: true, now, languages: ["en", "fr"] }).sites.map((x) => x.domain)).toContain("fr.com");
  });
  it("flags entries not re-verified in 30 days", () => {
    const r = recommendDirectories(data, { productType: "ai_tool", full: true, now });
    expect(r.sites.find((x) => x.domain === "old.com")?.stale).toBe(true);
    expect(r.sites.find((x) => x.domain === "auto-ai.com")?.stale).toBe(false);
  });
  it("collects the human-only steps into one checklist", () => {
    const r = recommendDirectories(data, { productType: "ai_tool", full: true, now });
    const inbox = r.human_checklist.find((c) => c.step === "email_inbox");
    expect(inbox?.domains).toContain("inbox.com");
    expect(r.human_checklist.find((c) => c.step === "captcha")?.domains).toContain("captcha.com");
  });
});

describe("shipped data", () => {
  it("contains no purchased third-party fields (DR, visits) — only our own measurements", () => {
    const text = JSON.stringify(realData).toLowerCase();
    for (const banned of ['"dr"', '"domain_rating"', '"visits"', '"monthly_visits"', '"traffic"', '"columbus"', "月访问", "外链类型"]) expect(text).not.toContain(banned);
  });
  it("has sites and an avoid list", () => {
    expect((realData as KitData).sites.length).toBeGreaterThan(50);
    expect((realData as KitData).avoid.length).toBeGreaterThan(10);
  });
});

describe("kitFaq (Submit Kit page FAQ, numbers from the dataset)", () => {
  it("states counts taken from the data, not typed", async () => {
    const { kitFaq } = await import("./directory-kit");
    const faq = kitFaq(data, now);
    const all = faq.map((f) => f.q + " " + f.a).join(" ");
    expect(all).toContain(`${data.sites.length} directories`);
    expect(all).toContain(`${data.avoid.length}`);
    expect(faq.find((f) => /MCP server/.test(f.q))?.a).toMatch(/\d+ directories fit an MCP server/);
    expect(all).not.toMatch(/guarantee|traffic boost|DR \d/i);
  });
});

describe("our_listing in recommendations", () => {
  it("adds what happened to our own listing on each site when known", () => {
    const first = recommendDirectories(data, { productType: "ai_tool", full: true, now }).sites[0];
    const r = recommendDirectories(data, { productType: "ai_tool", full: true, now, ours: { [first.domain]: "Live · followed link" } });
    expect(r.sites[0].our_listing).toBe("Live · followed link");
    expect(r.sites[1]?.our_listing ?? null).toBeNull();
  });
});

describe("kitProductJsonLd", () => {
  it("is a Product with a free and a paid offer at the real price", async () => {
    const { kitProductJsonLd, KIT_PRICE_USD } = await import("./directory-kit");
    const j = kitProductJsonLd("https://agentoolrank.com") as any;
    expect(j["@type"]).toBe("Product");
    expect(j.offers.map((o: any) => o.price)).toEqual(["0", String(KIT_PRICE_USD)]);
    expect(j.offers.every((o: any) => o.priceCurrency === "USD")).toBe(true);
  });
});
