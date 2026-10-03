import { describe, expect, it } from "vitest";
import { hashApiKey, keyId, newApiKey } from "./api-keys";

describe("api-keys (portable free keys: same table for ai-directory and new_ladar)", () => {
  it("issues prefixed random keys", () => {
    const a = newApiKey("ark");
    expect(a).toMatch(/^ark_[A-Za-z0-9_-]{32}$/);
    expect(newApiKey("ark")).not.toBe(a);
  });
  it("stores only a hash, and the call log's key_id is the hash prefix", () => {
    const k = "ark_testkey";
    expect(hashApiKey(k)).toMatch(/^[0-9a-f]{64}$/);
    expect(keyId(k)).toBe(hashApiKey(k).slice(0, 12));
  });
});
