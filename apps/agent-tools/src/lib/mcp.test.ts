import { describe, it, expect } from "vitest";
import { handleMcp, type McpDeps } from "./mcp";

const dify = { slug: "dify", name: "Dify", alternatives: ["flowise"] };
const deps: McpDeps = {
  search: async (q) => (q.includes("rag") ? [dify as never] : []),
  get: async (slug) => (slug === "dify" ? (dify as never) : null),
  getMany: async (slugs) => slugs.map((s) => ({ slug: s, name: s }) as never),
};

describe("handleMcp", () => {
  it("answers initialize with protocol version and tool capability", async () => {
    const r = await handleMcp({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18" } }, deps);
    expect(r).toMatchObject({ jsonrpc: "2.0", id: 1, result: { protocolVersion: "2025-06-18", capabilities: { tools: {} }, serverInfo: { name: "agentoolrank" } } });
  });

  it("returns null (no response) for notifications", async () => {
    expect(await handleMcp({ jsonrpc: "2.0", method: "notifications/initialized" }, deps)).toBeNull();
  });

  it("lists three tools with input schemas", async () => {
    const r = await handleMcp({ jsonrpc: "2.0", id: 2, method: "tools/list" }, deps);
    const names = (r as { result: { tools: Array<{ name: string; inputSchema: unknown }> } }).result.tools.map((t) => t.name);
    expect(names).toEqual(["search_tools", "get_tool", "get_alternatives"]);
  });

  it("calls search_tools and returns JSON text content", async () => {
    const r = await handleMcp({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "search_tools", arguments: { query: "rag chatbot" } } }, deps);
    const text = (r as { result: { content: Array<{ type: string; text: string }> } }).result.content[0].text;
    expect(JSON.parse(text)[0].slug).toBe("dify");
  });

  it("get_alternatives resolves alternative slugs", async () => {
    const r = await handleMcp({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "get_alternatives", arguments: { slug: "dify" } } }, deps);
    const text = (r as { result: { content: Array<{ text: string }> } }).result.content[0].text;
    expect(JSON.parse(text).alternatives[0].slug).toBe("flowise");
  });

  it("reports unknown tools as isError, unknown methods as JSON-RPC errors", async () => {
    const r1 = await handleMcp({ jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "get_tool", arguments: { slug: "nope" } } }, deps);
    expect((r1 as { result: { isError: boolean } }).result.isError).toBe(true);
    const r2 = await handleMcp({ jsonrpc: "2.0", id: 6, method: "bogus" }, deps);
    expect((r2 as { error: { code: number } }).error.code).toBe(-32601);
  });
});
