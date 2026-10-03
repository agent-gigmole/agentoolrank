import { describe, it, expect } from "vitest";
import { handleMcp, type McpDeps } from "./mcp";

const dify = { slug: "dify", name: "Dify", alternatives: ["flowise"] };
const deps: McpDeps = {
  search: async (q) => (q.includes("rag") ? [dify as never] : []),
  get: async (slug) => (slug === "dify" ? (dify as never) : null),
  getMany: async (slugs) => slugs.map((s) => ({ slug: s, name: s }) as never),
  submit: async (input, opts) => ({ status: "queued", submission_id: 9, echo: input, opts }),
  status: async (id, token) => (id === 9 && token === "t" ? { status: "pending", queue_position: 2 } : null),
  kitKeyValid: async (key) => key === "good-key",
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
    expect(names).toEqual(["search_tools", "get_tool", "get_alternatives", "submit_tool", "get_submission_status", "recommend_directories"]);
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

  it("submit_tool passes fields and budget/deadline through", async () => {
    const r = await handleMcp({ jsonrpc: "2.0", id: 7, method: "tools/call", params: { name: "submit_tool", arguments: { url: "https://a.dev", name: "A", tagline: "t", email: "a@b.co", max_budget_usd: 20, deadline_days: 3 } } }, deps);
    const d = JSON.parse((r as { result: { content: Array<{ text: string }> } }).result.content[0].text);
    expect(d.echo.url).toBe("https://a.dev");
    expect(d.opts).toMatchObject({ maxBudgetUsd: 20, deadlineDays: 3, src: "mcp" });
  });

  it("get_submission_status needs the right token", async () => {
    const ok = await handleMcp({ jsonrpc: "2.0", id: 8, method: "tools/call", params: { name: "get_submission_status", arguments: { submission_id: 9, status_token: "t" } } }, deps);
    expect((ok as { result: { isError: boolean } }).result.isError).toBe(false);
    const bad = await handleMcp({ jsonrpc: "2.0", id: 9, method: "tools/call", params: { name: "get_submission_status", arguments: { submission_id: 9, status_token: "x" } } }, deps);
    expect((bad as { result: { isError: boolean } }).result.isError).toBe(true);
  });

  it("recommend_directories: free sample without a key, full list with a valid key, error on a bad key", async () => {
    const call = async (args: Record<string, unknown>) => {
      const r = await handleMcp({ jsonrpc: "2.0", id: 9, method: "tools/call", params: { name: "recommend_directories", arguments: args } }, deps);
      return (r as { result: { content: Array<{ text: string }>; isError?: boolean } }).result;
    };
    const free = JSON.parse((await call({ product_type: "ai_tool" })).content[0].text);
    expect(free.sites.length).toBeLessThanOrEqual(10);
    expect(free.avoid).toBeUndefined();
    expect(free.upgrade).toMatch(/submit-kit/);
    const full = JSON.parse((await call({ product_type: "ai_tool", key: "good-key" })).content[0].text);
    expect(full.sites.length).toBeGreaterThan(10);
    expect(full.avoid.length).toBeGreaterThan(0);
    const bad = await call({ product_type: "ai_tool", key: "nope" });
    expect(bad.isError).toBe(true);
  });
});
