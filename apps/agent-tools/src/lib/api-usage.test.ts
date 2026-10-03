import { describe, expect, it } from "vitest";
import { callRow, clientFromUserAgent } from "./api-usage";

describe("api-usage (portable call log: same table + helper for ai-directory and new_ladar)", () => {
  it("keeps only the product token of the user agent, never the full string or IP", () => {
    expect(clientFromUserAgent("claude-code/1.0.58 (external, cli)")).toBe("claude-code/1.0.58");
    expect(clientFromUserAgent("Mozilla/5.0 (Windows NT 10.0) Chrome/130")).toBe("browser");
    expect(clientFromUserAgent("")).toBe("unknown");
  });
  it("builds a row with a hashed key prefix only", () => {
    const r = callRow({ surface: "mcp", tool: "recommend_directories", ok: true, ms: 12.6, key: "ark_kit_abcdef123456", ua: "cursor/0.42", src: "" });
    expect(r).toEqual({ surface: "mcp", tool: "recommend_directories", ok: 1, ms: 13, key_id: expect.stringMatching(/^[0-9a-f]{12}$/), client: "cursor/0.42", src: "" });
    expect(JSON.stringify(r)).not.toContain("abcdef123456");
    expect(callRow({ surface: "api", tool: "search", ok: false, ms: 1, ua: "", src: "x" }).key_id).toBe("");
  });
});
