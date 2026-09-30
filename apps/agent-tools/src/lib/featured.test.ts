import { describe, it, expect } from "vitest";
import { activeFeatured } from "./featured";

const now = new Date("2026-10-10T12:00:00Z");
describe("activeFeatured", () => {
  it("keeps only running slots, newest first, one per slug, max 6", () => {
    const rows = [
      { slug: "a", starts_at: "2026-10-01 00:00:00", ends_at: "2026-10-08 00:00:00" }, // ended
      { slug: "b", starts_at: "2026-10-09 00:00:00", ends_at: "2026-10-16 00:00:00" },
      { slug: "c", starts_at: "2026-10-10 00:00:00", ends_at: "2026-10-17 00:00:00" },
      { slug: "b", starts_at: "2026-10-10 06:00:00", ends_at: "2026-10-17 06:00:00" }, // renewal
      { slug: "d", starts_at: "2026-10-11 00:00:00", ends_at: "2026-10-18 00:00:00" }, // not started
    ];
    expect(activeFeatured(rows, now)).toEqual(["b", "c"]);
  });
});
