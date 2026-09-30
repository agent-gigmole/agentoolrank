import { describe, it, expect } from "vitest";
import { staleness } from "./staleness";

const now = new Date("2026-10-01T00:00:00Z");
describe("staleness", () => {
  it("flags no commit for 180+ days with months count", () => {
    expect(staleness("2026-02-01T00:00:00Z", now)).toEqual({ stale: true, months: 8 });
  });
  it("is not stale for recent commits or unknown dates", () => {
    expect(staleness("2026-09-01T00:00:00Z", now).stale).toBe(false);
    expect(staleness(null, now).stale).toBe(false);
  });
});
