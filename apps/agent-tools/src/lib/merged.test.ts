import { describe, it, expect } from "vitest";
import { MERGED, canonicalToolId, mergedRedirects } from "./merged";

describe("merged tools", () => {
  it("maps removed duplicate ids to the kept id", () => {
    expect(canonicalToolId("embedchain")).toBe("mem0");
    expect(canonicalToolId("mem0")).toBe("mem0");
    expect(canonicalToolId("dify")).toBe("dify");
  });
  it("never maps a kept id to another id (no chains)", () => {
    for (const kept of Object.values(MERGED)) expect(MERGED[kept]).toBeUndefined();
  });
  it("builds permanent redirects for tool and alternatives pages", () => {
    const r = mergedRedirects();
    expect(r).toContainEqual({ source: "/tool/gpt-index", destination: "/tool/llama-index", permanent: true });
    expect(r).toContainEqual({ source: "/alternatives/gpt-index", destination: "/alternatives/llama-index", permanent: true });
  });
});
