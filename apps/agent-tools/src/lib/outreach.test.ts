import { describe, it, expect } from "vitest";
import { outreachEmail, badgeMarkdown, isGroupAddress } from "./outreach";

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
