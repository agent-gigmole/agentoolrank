import { describe, it, expect } from "vitest";
import { isGonePath } from "./delisted";

const ids = ["career-ops"];
describe("isGonePath", () => {
  it.each(["/tool/career-ops", "/zh/tool/career-ops", "/ja/tool/career-ops", "/alternatives/career-ops", "/compare/career-ops-vs-orca", "/compare/codewhale-vs-career-ops"])("410 for %s", (p) => {
    expect(isGonePath(p, ids)).toBe(true);
  });
  it.each(["/tool/codewhale", "/tool/career-ops-pro", "/compare/codewhale-vs-orca", "/category/coding-agents", "/", "/tool/career-op"])("keeps %s", (p) => {
    expect(isGonePath(p, ids)).toBe(false);
  });
});
