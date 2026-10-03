import { describe, it, expect } from "vitest";
import { hashKitKey, newKitKey } from "./kit-keys";

describe("kit keys", () => {
  it("generates prefixed random keys", () => {
    const a = newKitKey(), b = newKitKey();
    expect(a).toMatch(/^ark_kit_[A-Za-z0-9_-]{32,}$/);
    expect(a).not.toBe(b);
  });
  it("stores only a stable sha256 hash", () => {
    expect(hashKitKey("ark_kit_x")).toBe(hashKitKey("ark_kit_x"));
    expect(hashKitKey("ark_kit_x")).toMatch(/^[0-9a-f]{64}$/);
    expect(hashKitKey("ark_kit_x")).not.toContain("ark_kit");
  });
});
