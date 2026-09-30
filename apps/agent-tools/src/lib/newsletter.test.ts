import { describe, it, expect } from "vitest";
import { newsletterHtml, newsletterSubject } from "./newsletter";

const data = {
  weekLabel: "Oct 6",
  gainers: [{ id: "skills", name: "Skills", gain: 26254, tagline: "Agent skills" }],
  newTools: [{ id: "fastmcp", name: "FastMCP", tagline: "Build MCP servers fast" }],
  quiet: [{ id: "metagpt", name: "MetaGPT", stars: 71000, lastCommit: "2026-01-21" }],
  baseUrl: "https://agentoolrank.com",
};

describe("newsletter", () => {
  it("subject names the top gainer", () => {
    expect(newsletterSubject(data)).toBe("AI agent tools this week: Skills +26,254 stars, 1 new tool");
  });
  const html = newsletterHtml(data, "https://agentoolrank.com/unsubscribe?t=abc");
  it("links every tool with tracking and includes an unsubscribe link", () => {
    expect(html).toContain('href="https://agentoolrank.com/tool/skills?ref=newsletter"');
    expect(html).toContain('href="https://agentoolrank.com/tool/fastmcp?ref=newsletter"');
    expect(html).toContain('href="https://agentoolrank.com/alternatives/metagpt?ref=newsletter"');
    expect(html).toContain("https://agentoolrank.com/unsubscribe?t=abc");
  });
  it("escapes HTML in tool text", () => {
    expect(newsletterHtml({ ...data, newTools: [{ id: "x", name: "<b>X</b>", tagline: "a & b" }] }, "u")).toContain("&lt;b&gt;X&lt;/b&gt;");
  });
});
