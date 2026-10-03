import { describe, expect, it } from "vitest";
import { whereCopy, WHERE_TYPES } from "./where-to-submit";

describe("whereCopy (per-type 'where to submit' landing pages)", () => {
  it("writes search-intent titles with the counts", () => {
    const c = whereCopy("mcp-server", { tested: 101, fits: 24, year: 2026 })!;
    expect(c.title).toBe("Where to Submit an MCP Server: 24 Directories That Fit (2026)");
    expect(c.h1).toBe("Where to submit an MCP server");
    expect(c.description).toContain("out of 101 we tested");
    expect(c.type).toBe("mcp_server");
  });
  it("uses 'an' for AI tool and 'a' for SaaS / developer tool", () => {
    expect(whereCopy("ai-tool", { tested: 1, fits: 1, year: 2026 })!.h1).toBe("Where to submit an AI tool");
    expect(whereCopy("saas", { tested: 1, fits: 1, year: 2026 })!.h1).toBe("Where to submit a SaaS");
    expect(whereCopy("dev-tool", { tested: 1, fits: 1, year: 2026 })!.h1).toBe("Where to submit a developer tool");
  });
  it("returns null for unknown slugs and keeps descriptions under 160 chars", () => {
    expect(whereCopy("nope", { tested: 1, fits: 1, year: 2026 })).toBeNull();
    for (const w of WHERE_TYPES) expect(whereCopy(w.slug, { tested: 101, fits: 40, year: 2026 })!.description.length).toBeLessThanOrEqual(160);
  });
});
