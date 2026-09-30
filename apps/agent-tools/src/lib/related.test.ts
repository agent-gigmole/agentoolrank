import { describe, it, expect } from "vitest";
import { buildRelated } from "./related";

describe("buildRelated", () => {
  const rows = [
    { id: "langgraph", name: "LangGraph", alternatives: ["crewai"], integrations: ["LangChain", "Langfuse", "CrewAI", "Unknown Thing"] },
    { id: "langchain", name: "LangChain", alternatives: [], integrations: [] },
    { id: "langfuse", name: "Langfuse", alternatives: [], integrations: ["LangGraph"] },
    { id: "crewai", name: "CrewAI", alternatives: [], integrations: [] },
  ];
  const rel = buildRelated(rows, 8);

  it("links tools both ways via integrations, ignoring unknown names", () => {
    expect(rel.get("langgraph")).toEqual(["langchain", "langfuse"]);
    expect(rel.get("langchain")).toEqual(["langgraph"]);
    expect(rel.get("langfuse")).toEqual(["langgraph"]);
  });

  it("excludes alternatives (those are competitors, not companions)", () => {
    expect(rel.get("langgraph")).not.toContain("crewai");
  });

  it("caps the list size", () => {
    expect(buildRelated(rows, 1).get("langgraph")).toHaveLength(1);
  });
});
