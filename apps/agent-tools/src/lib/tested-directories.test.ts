import { describe, it, expect } from "vitest";
import { filterDirectories, summarize, type TestedDirectory } from "./tested-directories";

const d = (o: Partial<TestedDirectory>): TestedDirectory => ({ domain: "x.com", free: "yes", conditions: [], queue: null, paidFrom: null, link: "unknown", login: ["none"], captcha: "unknown", human: [], verified: "2026-10-02", ...o });
const list = [
  d({ domain: "a.com" }),
  d({ domain: "b.com", conditions: ["badge"] }),
  d({ domain: "c.com", login: ["google"] }),
  d({ domain: "d.com", free: "no", paidFrom: 19 }),
  d({ domain: "e.com", captcha: "recaptcha", human: ["captcha"] }),
  d({ domain: "f.com", link: "nofollow" }),
];

describe("filterDirectories", () => {
  it("returns everything with no filters", () => {
    expect(filterDirectories(list, {})).toHaveLength(6);
  });
  it("free only drops paid-only sites", () => {
    expect(filterDirectories(list, { freeOnly: true }).map((x) => x.domain)).not.toContain("d.com");
  });
  it("no badge or backlink drops sites that require either", () => {
    expect(filterDirectories(list, { noBadge: true }).map((x) => x.domain)).not.toContain("b.com");
  });
  it("no login keeps only sites that need no account", () => {
    expect(filterDirectories(list, { noLogin: true }).map((x) => x.domain)).not.toContain("c.com");
  });
  it("no human step drops captcha sites", () => {
    expect(filterDirectories(list, { noHuman: true }).map((x) => x.domain)).not.toContain("e.com");
  });
  it("combines filters", () => {
    expect(filterDirectories(list, { freeOnly: true, noBadge: true, noLogin: true, noHuman: true }).map((x) => x.domain)).toEqual(["a.com", "f.com"]);
  });
});

describe("summarize", () => {
  it("counts the headline numbers", () => {
    expect(summarize(list)).toEqual({ total: 6, free: 5, badgeOrBacklink: 1, needsHuman: 1, linkChecked: 1, nofollowOfChecked: 1 });
  });
});
