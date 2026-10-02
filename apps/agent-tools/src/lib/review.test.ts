import { describe, it, expect } from "vitest";
import { englishOnlyTagline, isMetaNote, stripMetaNotes, stripMetaSentences, isTruncatedTagline, submissionTagline, parseReview, toolRowFromReview, hasBacklink, reviewOrder } from "./review";

const cats = ["coding-agents", "agent-frameworks", "memory-knowledge"];

describe("parseReview", () => {
  it("accepts a well-formed approval and normalizes fields", () => {
    const raw = '```json\n{"decision":"approve","reason":"agent framework","category":"agent-frameworks","tagline":"  Build agents fast  ","description":"desc","pricing":"open-source","intelligence":{"capabilities":["a"],"key_differentiator":"k","best_for":["b"],"not_for":[],"limitations":["l"],"integrations":["OpenAI"]}}\n```';
    const r = parseReview(raw, cats);
    expect(r).toMatchObject({ decision: "approve", category: "agent-frameworks", tagline: "Build agents fast", pricing: "open-source" });
    expect(r?.intelligence.capabilities).toEqual(["a"]);
  });

  it("forces reject when category is unknown on an approval, and rejects garbage", () => {
    expect(parseReview('{"decision":"approve","category":"crypto","tagline":"t","description":"d","pricing":"free","intelligence":{}}', cats)?.decision).toBe("reject");
    expect(parseReview("nope", cats)).toBeNull();
  });

  it("falls back to 'freemium' for unknown pricing", () => {
    expect(parseReview('{"decision":"approve","category":"coding-agents","tagline":"t","description":"d","pricing":"weird","intelligence":{}}', cats)?.pricing).toBe("freemium");
  });
});

describe("toolRowFromReview", () => {
  it("builds an insert row from a submission and review", () => {
    const row = toolRowFromReview(
      { slug: "acme-agent", name: "Acme Agent", url: "https://acme.dev", github_url: "https://github.com/acme/agent", tagline: "maker tagline" },
      { decision: "approve", reason: "", category: "coding-agents", tagline: "LLM tagline", description: "d", pricing: "open-source", intelligence: { capabilities: ["x"] } },
    );
    expect(row).toMatchObject({ id: "acme-agent", name: "Acme Agent", website_url: "https://acme.dev", github_owner: "acme", github_repo: "agent", category_tags: '["coding-agents"]', tagline: "maker tagline", source: "manual", pricing: "open-source" });
    expect(JSON.parse(row.intelligence).capabilities).toEqual(["x"]);
  });
});

describe("hasBacklink", () => {
  it("detects a link to agentoolrank.com in HTML", () => {
    expect(hasBacklink('<a href="https://agentoolrank.com/tool/x">')).toBe(true);
    expect(hasBacklink('<a href="https://www.agentoolrank.com">')).toBe(true);
    expect(hasBacklink("<p>agentoolrank</p>")).toBe(false);
  });
});

describe("reviewOrder", () => {
  it("puts paid first, then badge holders, then oldest", () => {
    const subs = [
      { id: 1, plan: "free", backlink_verified: 0 },
      { id: 2, plan: "free", backlink_verified: 1 },
      { id: 3, plan: "fast", backlink_verified: 0 },
    ];
    expect([...subs].sort(reviewOrder).map((s) => s.id)).toEqual([3, 2, 1]);
  });
});

describe("tagline truncation", () => {
  it("detects taglines cut off by a length limit", () => {
    expect(isTruncatedTagline("x".repeat(150) + " tolerance and scalability of a c")).toBe(true);
    expect(isTruncatedTagline("A programming framework for agentic AI")).toBe(false);
    expect(isTruncatedTagline("y".repeat(170) + " fully finished sentence.")).toBe(false);
  });
  it("only keeps a GitHub description as tagline when it was not cut", () => {
    expect(submissionTagline("Short description")).toBe("Short description");
    expect(submissionTagline("z".repeat(161))).toBe("");
  });
});

describe("stripMetaSentences", () => {
  it("drops sentences about the reviewer's evidence from prose", () => {
    expect(stripMetaSentences("Databerry builds chatbots. The provided documentation is minimal, which limits the ability to provide detailed insights. It is open source."))
      .toBe("Databerry builds chatbots. It is open source.");
  });
});

describe("reviewer meta-notes", () => {
  it("recognises notes about the review process rather than the product", () => {
    expect(isMetaNote("Website content could not be fetched for full verification")).toBe(true);
    expect(isMetaNote("Evidence limited to README description")).toBe(true);
    expect(isMetaNote("No website content available for verification")).toBe(true);
    expect(isMetaNote("Requires Python development knowledge")).toBe(false);
    expect(isMetaNote("Cannot fetch pages behind a login")).toBe(false);
    expect(isMetaNote("Limited information available about enterprise support")).toBe(true);
    expect(isMetaNote("Limited documentation available in the provided README excerpt to fully evaluate feature completeness")).toBe(true);
    expect(isMetaNote("Documentation appears incomplete as the README content cuts off mid-example")).toBe(true);
    expect(isMetaNote("Feature set unclear from open-source README alone")).toBe(true);
    expect(isMetaNote("No direct evidence of voice agent capabilities")).toBe(true);
    expect(isMetaNote("Minimal README — documentation is external (docs.dust.tt)")).toBe(false);
  });
  it("strips them from every intelligence list", () => {
    expect(stripMetaNotes({ limitations: ["Needs Docker", "Website details unavailable"], best_for: ["RAG"], key_differentiator: "x" }))
      .toEqual({ limitations: ["Needs Docker"], best_for: ["RAG"], key_differentiator: "x" });
  });
});

describe("englishOnlyTagline", () => {
  it("drops CJK segments from bilingual taglines", () => {
    expect(englishOnlyTagline("An open-source, privacy-first knowledge workspace 开源、隐私优先的知识工作空间")).toBe("An open-source, privacy-first knowledge workspace");
    expect(englishOnlyTagline("基于 ChatGPT API 的划词翻译插件    -    Browser extension for translation based on ChatGPT API.")).toBe("Browser extension for translation based on ChatGPT API.");
    expect(englishOnlyTagline("🔥 MaxKB is an open-source platform for building enterprise-grade agents.  强大易用的开源企业级智能体平台。")).toBe("🔥 MaxKB is an open-source platform for building enterprise-grade agents.");
  });
  it("keeps the English part when CJK comes first with a separator", () => {
    expect(englishOnlyTagline("🏛️ 三省六部制 · OpenClaw Multi-Agent Orchestration System")).toBe("OpenClaw Multi-Agent Orchestration System");
  });
  it("leaves pure English taglines alone", () => {
    expect(englishOnlyTagline("Run LLMs locally")).toBe("Run LLMs locally");
  });
});
