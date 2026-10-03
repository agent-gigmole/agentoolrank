import { describe, expect, it } from "vitest";
import { currentById, devtoComments, newFeedback, overdue } from "./feedback";

describe("currentById", () => {
  it("keeps the last line per id (the inbox is append-only)", () => {
    const m = currentById([{ id: "a", status: "new" }, { id: "b", status: "new" }, { id: "a", status: "adopted" }]);
    expect(m.get("a")?.status).toBe("adopted");
    expect(m.size).toBe(2);
  });
});

describe("newFeedback", () => {
  it("drops items already in the inbox and our own accounts", () => {
    const got = newFeedback(new Set(["devto:1"]), [
      { id: "devto:1", author: "someone" },
      { id: "devto:2", author: "agentoolrank" },
      { id: "devto:3", author: "someone" },
    ]);
    expect(got.map((g) => g.id)).toEqual(["devto:3"]);
  });
});

describe("devtoComments", () => {
  it("flattens threaded comments and strips html", () => {
    const flat = devtoComments(42, "https://dev.to/x", [
      { id_code: "c1", body_html: "<p>Add <b>pricing</b></p>", user: { username: "u1" }, children: [{ id_code: "c2", body_html: "<p>+1</p>", user: { username: "u2" }, children: [] }] },
    ]);
    expect(flat).toEqual([
      { id: "devto:c1", url: "https://dev.to/x#comment-c1", author: "u1", text: "Add pricing" },
      { id: "devto:c2", url: "https://dev.to/x#comment-c2", author: "u2", text: "+1" },
    ]);
  });
});

describe("overdue", () => {
  it("lists our entries still new after 48 hours", () => {
    const now = 1_000_000;
    const rows = [
      { id: "a", project: "ai-directory", status: "new", collected_at: now - 49 * 3600 },
      { id: "b", project: "ai-directory", status: "new", collected_at: now - 3600 },
      { id: "c", project: "imagehub", status: "new", collected_at: now - 99 * 3600 },
      { id: "d", project: "ai-directory", status: "answered", collected_at: now - 99 * 3600 },
    ];
    expect(overdue(rows, now).map((r) => r.id)).toEqual(["a"]);
  });
});
