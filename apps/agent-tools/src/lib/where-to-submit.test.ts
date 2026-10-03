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

import { whereFaq } from "./where-to-submit";

describe("whereFaq (numbers counted from the type's sites)", () => {
  const sites = [
    { free: "yes", conditions: [], human: [], link: "dofollow" },
    { free: "yes", conditions: ["badge"], human: ["captcha"], link: "nofollow" },
    { free: "no", conditions: [], human: ["email_inbox"], link: "unknown" },
  ];
  it("counts free-without-conditions, agent-finishable and dofollow sites", () => {
    const f = whereFaq("an MCP server", sites);
    expect(f[0].a).toContain("3 of the directories we tested accept an MCP server");
    expect(f[0].a).toContain("1 of them have a free listing with no badge");
    expect(f[1].a).toContain("On 1 of the 3 an agent could finish");
    expect(f[2].a).toContain("We checked the live link on 2 of the 3; 1 were dofollow");
  });
});
