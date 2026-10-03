import { describe, it, expect } from "vitest";
import { parseEvent, isBotUserAgent, sourceFromUrl } from "./events";

describe("parseEvent", () => {
  it("accepts known events and trims fields", () => {
    const e = parseEvent({ n: "page_view", p: "/tool/dify?x=1", r: "https://google.com/", s: "google/cpc", sid: "abc123" });
    expect(e).toEqual({ name: "page_view", path: "/tool/dify", ref: "google.com", src: "google/cpc", sid: "abc123" });
  });

  it("rejects unknown event names and bad input", () => {
    expect(parseEvent({ n: "hack", p: "/" })).toBeNull();
    expect(parseEvent(null)).toBeNull();
    expect(parseEvent({ n: "page_view", p: 5 })).toBeNull();
  });

  it("drops self-referrals and caps lengths", () => {
    const e = parseEvent({ n: "page_view", p: "/" + "a".repeat(500), r: "https://agentoolrank.com/x", sid: "s" });
    expect(e?.ref).toBe("");
    expect(e?.path.length).toBeLessThanOrEqual(200);
  });
});

describe("isBotUserAgent", () => {
  it("flags crawlers and headless browsers", () => {
    expect(isBotUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true);
    expect(isBotUserAgent("Mozilla/5.0 HeadlessChrome/120")).toBe(true);
    expect(isBotUserAgent("")).toBe(true);
    expect(isBotUserAgent("Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/128 Safari/537.36")).toBe(false);
  });
});

describe("sourceFromUrl", () => {
  it("reads utm_source/medium/campaign, or ref", () => {
    expect(sourceFromUrl("https://agentoolrank.com/?utm_source=x&utm_medium=social&utm_campaign=launch")).toBe("x/social/launch");
    expect(sourceFromUrl("https://agentoolrank.com/?ref=peerpush")).toBe("peerpush");
    expect(sourceFromUrl("https://agentoolrank.com/tool/dify")).toBe("");
  });
});

describe("kit_click", () => {
  it("is an accepted event so the Submit Kit entry on /submit can be measured", async () => {
    const { EVENT_NAMES } = await import("./events");
    expect(EVENT_NAMES).toContain("kit_click");
  });
});
