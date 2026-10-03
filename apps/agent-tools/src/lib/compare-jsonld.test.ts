import { describe, expect, it } from "vitest";
import { compareJsonLd } from "./compare-jsonld";

describe("compareJsonLd", () => {
  const a = { id: "langchain", name: "LangChain", tagline: "LLM framework", website_url: "https://langchain.com", github_url: "https://github.com/langchain-ai/langchain" };
  const b = { id: "mastra", name: "Mastra", tagline: "TS agents", website_url: null, github_url: "https://github.com/mastra-ai/mastra" };
  it("lists both tools as SoftwareApplication with their AgentoolRank pages", () => {
    const j = compareJsonLd(a, b, 169366312, null, "https://agentoolrank.com") as any;
    expect(j["@type"]).toBe("ItemList");
    expect(j.itemListElement.map((x: any) => x.item.name)).toEqual(["LangChain", "Mastra"]);
    expect(j.itemListElement[0].item.url).toBe("https://agentoolrank.com/tool/langchain");
  });
  it("adds the download counter only where we have a number", () => {
    const j = compareJsonLd(a, b, 169366312, null, "https://agentoolrank.com") as any;
    expect(j.itemListElement[0].item.interactionStatistic.userInteractionCount).toBe(169366312);
    expect(j.itemListElement[1].item.interactionStatistic).toBeUndefined();
  });
});
