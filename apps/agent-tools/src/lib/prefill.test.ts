import { describe, expect, it } from "vitest";
import { prefillFromRepo } from "./prefill";

describe("prefillFromRepo (submit form: paste a GitHub URL, get name / tagline / website)", () => {
  it("maps GitHub repo JSON to form fields, cleaning the description", () => {
    expect(prefillFromRepo({ name: "crewAI", description: "  Framework for orchestrating role-playing agents 🤖 ", homepage: "https://crewai.com", html_url: "https://github.com/crewAIInc/crewAI" })).toEqual({
      name: "crewAI",
      tagline: "Framework for orchestrating role-playing agents",
      url: "https://crewai.com",
      github_url: "https://github.com/crewAIInc/crewAI",
    });
  });
  it("falls back to the repo page when there is no homepage, and trims long descriptions to 160 chars", () => {
    const r = prefillFromRepo({ name: "x", description: "a".repeat(300), homepage: "", html_url: "https://github.com/o/x" });
    expect(r.url).toBe("https://github.com/o/x");
    expect(r.tagline.length).toBeLessThanOrEqual(160);
  });
});
