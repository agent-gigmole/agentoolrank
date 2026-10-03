import { describe, it, expect } from "vitest";
import { parseEvent, isBotUserAgent, sourceFromUrl } from "./events";

describe("parseEvent", () => {
  it("accepts known events and trims fields", () => {
    const e = parseEvent({ n: "page_view", p: "/tool/dify?x=1", r: "https://google.com/", s: "google/cpc", sid: "abc123" });
    expect(e).toEqual({ name: "page_view", path: "/tool/dify", ref: "google.com", src: "google/cpc", sid: "abc123", props: "{}" });
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

describe("visitor-insights props", () => {
  const base = { p: "/tool/dify", r: "", s: "", sid: "abc" };
  it("accepts the shared vi events", () => {
    for (const n of ["engagement", "ui_click", "exit_survey"]) expect(parseEvent({ ...base, n })?.name).toBe(n);
  });
  it("keeps only whitelisted, bounded props", () => {
    expect(parseEvent({ ...base, n: "engagement", props: { seconds: 42.4, scroll: 130, email: "a@b.c" } })?.props).toBe('{"seconds":42,"scroll":100}');
    expect(parseEvent({ ...base, n: "ui_click", props: { label: "/submit-kit" } })?.props).toBe('{"label":"/submit-kit"}');
    expect(parseEvent({ ...base, n: "exit_survey", props: { action: "answer", reason: "price" } })?.props).toBe('{"action":"answer","reason":"price"}');
    expect(parseEvent({ ...base, n: "page_view", props: { touch: true } })?.props).toBe('{"touch":true}');
  });
  it("drops free text and unknown survey keys", () => {
    expect(parseEvent({ ...base, n: "ui_click", props: { label: "Buy now for me@x.com" } })?.props).toBe("{}");
    expect(parseEvent({ ...base, n: "exit_survey", props: { action: "answer", reason: "too expensive lol" } })?.props).toBe('{"action":"answer"}');
  });
});

describe("visitor-insights v3 helpers (agentkit 0cecb30)", () => {
  it("counts a page that fits on screen as 100% scrolled", async () => {
    const { scrollPercent } = await import("./events");
    expect(scrollPercent(0, 800, 900)).toBe(100);
    expect(scrollPercent(0, 2000, 1000)).toBe(0);
    expect(scrollPercent(500, 2000, 1000)).toBe(50);
    expect(scrollPercent(5000, 2000, 1000)).toBe(100);
  });
  it("labels clicks by test id, same-origin path, anchor, mailto, tel or external", async () => {
    const { clickLabel } = await import("./events");
    const o = "https://agentoolrank.com";
    expect(clickLabel("buy-kit", "/x", o)).toBe("buy-kit");
    expect(clickLabel(null, "/submit-kit?ref=a", o)).toBe("/submit-kit");
    expect(clickLabel(null, "https://agentoolrank.com/tool/dify", o)).toBe("/tool/dify");
    expect(clickLabel(null, "#faq", o)).toBe("#anchor");
    expect(clickLabel(null, "mailto:hello@agentoolrank.com", o)).toBe("mailto");
    expect(clickLabel(null, "https://github.com/x", o)).toBe("external");
    expect(clickLabel(null, null, o)).toBe("");
  });
  it("accepts the new fixed labels server-side", () => {
    for (const label of ["#anchor", "mailto", "tel"]) expect(parseEvent({ n: "ui_click", p: "/", r: "", s: "", sid: "a", props: { label } })?.props).toBe(JSON.stringify({ label }));
  });
});
