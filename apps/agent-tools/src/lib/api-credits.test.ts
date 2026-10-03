import { describe, expect, it } from "vitest";
import { decideCharge } from "./api-credits";

// Shared credits logic (agentkit 10-03 22:20: one charging implementation for ai-directory and new_ladar; prices differ).
describe("decideCharge", () => {
  const pricing = { dailyFree: 20, costs: { recommend_directories_full: 10, search_tools: 0 } as Record<string, number> };
  it("free tools never charge", () => {
    expect(decideCharge({ tool: "search_tools", usedToday: 999, balance: 0 }, pricing)).toEqual({ ok: true, fromFree: 0, fromBalance: 0 });
  });
  it("uses today's free allowance first, then the paid balance", () => {
    expect(decideCharge({ tool: "recommend_directories_full", usedToday: 5, balance: 0 }, pricing)).toEqual({ ok: true, fromFree: 10, fromBalance: 0 });
    expect(decideCharge({ tool: "recommend_directories_full", usedToday: 15, balance: 100 }, pricing)).toEqual({ ok: true, fromFree: 5, fromBalance: 5 });
  });
  it("refuses when free allowance and balance can't cover it, and says how short", () => {
    expect(decideCharge({ tool: "recommend_directories_full", usedToday: 20, balance: 3 }, pricing)).toEqual({ ok: false, short: 7 });
  });
  it("unknown tools cost 1 by default", () => {
    expect(decideCharge({ tool: "lookup", usedToday: 0, balance: 0 }, { dailyFree: 0, costs: {} })).toEqual({ ok: false, short: 1 });
  });
});

describe("chargeCall over a storage interface (any DB: SQLite here, Postgres in new_ladar)", () => {
  it("decides with the pure rule and applies through the store", async () => {
    const { chargeCall, memoryStore } = await import("./api-credits");
    const store = memoryStore({ k: 7 });
    const p = { dailyFree: 5, costs: { full: 10 } };
    expect(await chargeCall(store, "k", "full", "2026-10-03", p)).toEqual({ ok: true, fromFree: 5, fromBalance: 5 });
    expect(await store.balance("k")).toBe(2);
    expect(await store.usedToday("k", "2026-10-03")).toBe(5);
    expect(await chargeCall(store, "k", "full", "2026-10-03", p)).toEqual({ ok: false, short: 8 });
    expect(await store.balance("k")).toBe(2); // a refused call changes nothing
  });
});
