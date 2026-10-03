import { describe, expect, it } from "vitest";
import { liveEmail } from "./live-email";

describe("liveEmail (the /submit form promises 'we'll email you when your page is live')", () => {
  const e = liveEmail({ name: "Legba", slug: "legba", baseUrl: "https://agentoolrank.com" });
  it("names the tool and links its page", () => {
    expect(e.subject).toBe("Legba is live on AgentoolRank");
    expect(e.text).toContain("https://agentoolrank.com/tool/legba?ref=live-notify");
  });
  it("carries the badge snippet and the featured link with its price", () => {
    expect(e.text).toContain('src="https://agentoolrank.com/api/badge/legba"');
    expect(e.text).toContain("https://agentoolrank.com/tool/legba?ref=live-notify#maintainers");
    expect(e.text).toContain("$49");
  });
  it("never says it was written by AI", () => {
    expect(e.text).not.toMatch(/\bAI[- ](?:written|generated)|written by (?:an )?AI|automated message/i);
  });
});
