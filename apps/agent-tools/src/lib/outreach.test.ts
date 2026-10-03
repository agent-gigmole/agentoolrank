import { describe, it, expect } from "vitest";
import { outreachEmail, badgeMarkdown, isGroupAddress, sendingBlocked, preflightSkip } from "./outreach";

describe("outreach", () => {
  const e = outreachEmail({ owner: "Jane", name: "FastMCP", slug: "fastmcp", rank: 2, total: 29, category: "MCP Servers" }, "https://agentoolrank.com");
  it("states the rank, links the page and offers a README badge", () => {
    expect(e.subject).toBe("FastMCP's current rank on AgentoolRank");
    expect(e.text).toContain("#2 of 29 in MCP Servers");
    expect(e.text).toContain("https://agentoolrank.com/tool/fastmcp?ref=outreach");
    expect(e.text).toContain(badgeMarkdown("https://agentoolrank.com", "fastmcp", "FastMCP"));
  });
  it("identifies the sender and offers an opt-out", () => {
    expect(e.text).toContain("Jason T.");
    expect(e.text.toLowerCase()).toContain("reply \"no\"");
  });
  it("makes no paid pitch", () => {
    expect(e.text).not.toMatch(/\$\d|pay|price|featured/i);
  });
});

describe("isGroupAddress", () => {
  it.each(["mlflow-users@googlegroups.com", "dev@lists.example.org", "announce@project.io", "project-discuss@x.org", "noreply@x.com"])("flags %s", (e) => {
    expect(isGroupAddress(e)).toBe(true);
  });
  it.each(["hello@dify.ai", "ishaan@berri.ai", "support@langchain.dev", "opendatalab@pjlab.org.cn"])("allows %s", (e) => {
    expect(isGroupAddress(e)).toBe(false);
  });
});

describe("sendingBlocked (nightly outreach pipeline gate)", () => {
  const clean = { hardBounces: 0, softBounces: 0, blocked: 0, spamReports: 0, invalid: 0 };
  it("lets a clean week through", () => {
    expect(sendingBlocked({ ...clean }, { ...clean })).toBeNull();
  });
  it("stops on any bounce, block, spam report or invalid address in our own outreach tag", () => {
    expect(sendingBlocked({ ...clean, hardBounces: 1 }, clean)).toMatch(/outreach/);
    expect(sendingBlocked({ ...clean, spamReports: 1 }, clean)).toMatch(/outreach/);
  });
  it("stops on spam reports or blocks anywhere on the shared account, but not on another tag's single bounce", () => {
    expect(sendingBlocked(clean, { ...clean, spamReports: 1 })).toMatch(/account/);
    expect(sendingBlocked(clean, { ...clean, blocked: 2 })).toMatch(/account/);
    expect(sendingBlocked(clean, { ...clean, hardBounces: 1 })).toBeNull();
  });
});

describe("preflightSkip (shared Brevo account guard, agentkit 17:05)", () => {
  it("skips domains without MX and addresses Brevo already blocked for any project", () => {
    expect(preflightSkip("a@nomx.dev", 0, new Set())).toMatch(/MX/);
    expect(preflightSkip("Gone@Acme.dev", 1, new Set(["gone@acme.dev"]))).toMatch(/blocked/);
    expect(preflightSkip("ok@acme.dev", 2, new Set(["gone@acme.dev"]))).toBeNull();
  });
});

describe("outreachEmail with package downloads", () => {
  const base = { owner: "Jane", name: "FastMCP", slug: "fastmcp", rank: 2, total: 29, category: "MCP Servers" };
  it("adds one factual line when we have a download count", () => {
    const e = outreachEmail({ ...base, downloads: { label: "PyPI", pkg: "fastmcp", value: "1.2M" } }, "https://agentoolrank.com");
    expect(e.text).toContain("Its PyPI package fastmcp had 1.2M downloads in the last 30 days; the page shows that next to stars (https://agentoolrank.com/downloads).");
    expect(e.text).not.toMatch(/\$\d|pay|price/i);
  });
  it("leaves the email unchanged without one", () => {
    expect(outreachEmail(base, "https://agentoolrank.com").text).not.toContain("downloads in the last 30 days");
  });
});

describe("mxVerdict (only a definite DNS answer opts an address out — agentkit 10-03 20:41)", () => {
  it("treats ENOTFOUND / ENODATA as no MX, other errors as unknown", async () => {
    const { mxVerdict } = await import("./outreach");
    expect(mxVerdict({ records: 2 })).toBe("ok");
    expect(mxVerdict({ records: 0 })).toBe("none");
    expect(mxVerdict({ error: "ENOTFOUND" })).toBe("none");
    expect(mxVerdict({ error: "ENODATA" })).toBe("none");
    expect(mxVerdict({ error: "ETIMEOUT" })).toBe("unknown");
    expect(mxVerdict({ error: "ESERVFAIL" })).toBe("unknown");
  });
});

describe("badge choice in outreach", () => {
  const base = { owner: "Jane", name: "Browser-Use", slug: "browser-use", rank: 1, total: 29, category: "Browser & Web Agents" };
  it("offers the downloads badge when the package has ≥100K monthly downloads", () => {
    const e = outreachEmail({ ...base, downloads: { label: "PyPI", pkg: "browser-use", value: "7.4M", n: 7_400_000 } }, "https://agentoolrank.com");
    expect(e.text).toContain("https://agentoolrank.com/api/badge/browser-use?metric=downloads");
    expect(e.text).toContain("shows the live monthly downloads");
  });
  it("keeps the stars badge below that", () => {
    const e = outreachEmail({ ...base, downloads: { label: "npm", pkg: "x", value: "5.0K", n: 5000 } }, "https://agentoolrank.com");
    expect(e.text).not.toContain("metric=downloads");
    expect(e.text).toContain(badgeMarkdown("https://agentoolrank.com", "browser-use", "Browser-Use"));
  });
});

describe("dohMxVerdict (confirm a local 'no MX' with DNS-over-HTTPS before opting out)", () => {
  it("reads Google DoH JSON", async () => {
    const { dohMxVerdict } = await import("./outreach");
    expect(dohMxVerdict({ Status: 0, Answer: [{ type: 15, data: "5 mx2.feishu.cn." }] })).toBe("ok");
    expect(dohMxVerdict({ Status: 3 })).toBe("none"); // NXDOMAIN
    expect(dohMxVerdict({ Status: 0 })).toBe("none"); // domain exists, no MX
    expect(dohMxVerdict({ Status: 2 })).toBe("unknown"); // SERVFAIL
    expect(dohMxVerdict(null)).toBe("unknown");
  });
});

describe("uniqueByEmail", () => {
  it("keeps the first candidate per address so one run never mails a person twice", async () => {
    const { uniqueByEmail } = await import("./outreach");
    expect(uniqueByEmail([{ email: "A@x.com", slug: "a" }, { email: "a@x.com", slug: "b" }, { email: "c@x.com", slug: "c" }]).map((c) => c.slug)).toEqual(["a", "c"]);
  });
});
