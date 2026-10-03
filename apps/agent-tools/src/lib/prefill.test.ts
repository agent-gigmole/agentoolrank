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
  it("cuts long descriptions at a sentence, else a word boundary, never mid-word", () => {
    const d = "Framework for orchestrating role-playing, autonomous AI agents. By fostering collaborative intelligence, CrewAI empowers agents to work together seamlessly, tackling complex tasks.";
    expect(prefillFromRepo({ name: "c", description: d, homepage: null, html_url: "https://github.com/o/c" }).tagline).toBe(
      "Framework for orchestrating role-playing, autonomous AI agents.",
    );
    const w = prefillFromRepo({ name: "c", description: "word ".repeat(50), homepage: null, html_url: "https://github.com/o/c" }).tagline;
    expect(w.length).toBeLessThanOrEqual(160);
    expect(w.endsWith("word")).toBe(true);
  });
});
