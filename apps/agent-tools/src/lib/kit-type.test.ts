import { describe, expect, it } from "vitest";
import { kitTypeForCategories } from "./directory-kit";

describe("kitTypeForCategories (Submit Kit link preselects the right list)", () => {
  it("MCP categories → mcp_server, anything else → ai_tool", () => {
    expect(kitTypeForCategories(["mcp-servers"])).toBe("mcp_server");
    expect(kitTypeForCategories(["agent-frameworks", "mcp-servers"])).toBe("mcp_server");
    expect(kitTypeForCategories(["agent-frameworks"])).toBe("ai_tool");
    expect(kitTypeForCategories(null)).toBe("ai_tool");
  });
});
