import { describe, it, expect } from "vitest";
import { validateSubmission, slugFromSubmission, badgeHtml, estimatedWaitDays } from "./submissions";

const good = {
  url: "https://Example.com/product/",
  name: "Example Agent",
  email: "Maker@Example.com ",
  tagline: "An agent that files your taxes",
  github_url: "https://github.com/acme/example-agent",
  website: "", // honeypot
};

describe("validateSubmission", () => {
  it("accepts a good submission and normalizes url and email", () => {
    const r = validateSubmission(good);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.url).toBe("https://example.com/product");
      expect(r.value.email).toBe("maker@example.com");
      expect(r.value.github_url).toBe("https://github.com/acme/example-agent");
    }
  });

  it("rejects face swap / adult tools up front, including glued spellings in the domain", () => {
    const r = validateSubmission({ ...good, url: "https://aiswapface.org", name: "AI Swap" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toContain("AgentoolRank doesn't list face swap, deepfake or adult tools.");
    expect(validateSubmission({ ...good, tagline: "Undress any photo with AI" }).ok).toBe(false);
  });

  it("rejects missing url, bad email, non-http url", () => {
    expect(validateSubmission({ ...good, url: "" }).ok).toBe(false);
    expect(validateSubmission({ ...good, url: "javascript:alert(1)" }).ok).toBe(false);
    expect(validateSubmission({ ...good, email: "nope" }).ok).toBe(false);
  });

  it("rejects a github_url that is not a repo url, but allows it to be empty", () => {
    expect(validateSubmission({ ...good, github_url: "https://gitlab.com/a/b" }).ok).toBe(false);
    const r = validateSubmission({ ...good, github_url: "" });
    expect(r.ok && r.value.github_url).toBe(null);
  });

  it("flags the honeypot as spam", () => {
    const r = validateSubmission({ ...good, website: "http://spam" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.spam).toBe(true);
  });

  it("caps field lengths", () => {
    expect(validateSubmission({ ...good, tagline: "x".repeat(161) }).ok).toBe(false);
    expect(validateSubmission({ ...good, name: "" }).ok).toBe(false);
  });
});

describe("slugFromSubmission", () => {
  it("prefers the GitHub repo name, else the name", () => {
    expect(slugFromSubmission({ name: "Example Agent", github_url: "https://github.com/acme/Example-Agent" })).toBe("example-agent");
    expect(slugFromSubmission({ name: "My Cool Tool!", github_url: null })).toBe("my-cool-tool");
  });
});

describe("badgeHtml", () => {
  it("links to the tool page with a followable link and an image", () => {
    const html = badgeHtml("https://agentoolrank.com", "example-agent", "Example Agent");
    expect(html).toContain('href="https://agentoolrank.com/tool/example-agent"');
    expect(html).toContain('src="https://agentoolrank.com/api/badge/example-agent"');
    expect(html).toContain('alt="Example Agent on AgentoolRank"');
    expect(html).not.toContain("nofollow");
  });
});

describe("estimatedWaitDays", () => {
  it("is at least 1 day and grows with queue position", () => {
    expect(estimatedWaitDays(1)).toBe(1);
    expect(estimatedWaitDays(30)).toBeGreaterThan(estimatedWaitDays(5));
  });
});
