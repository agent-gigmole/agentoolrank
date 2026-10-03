import { describe, expect, it } from "vitest";
import { dueEntries, splitTitle } from "./devto-schedule";

describe("splitTitle", () => {
  it("takes the first H1 as the title and drops it from the body", () => {
    expect(splitTitle("# Hello world\n\nBody **text**\n")).toEqual({ title: "Hello world", body: "Body **text**\n" });
  });
  it("refuses a draft without an H1", () => {
    expect(() => splitTitle("no title here")).toThrow(/H1/);
  });
});

describe("dueEntries", () => {
  const sched = [
    { file: "a.md", publish_at: "2026-10-07T09:00:00+08:00", tags: ["ai"] },
    { file: "b.md", publish_at: "2026-10-12T09:00:00+08:00", tags: [] },
    { file: "c.md", publish_at: "2026-10-01T09:00:00+08:00", tags: [], url: "https://dev.to/x" },
  ];
  it("returns entries whose time has come and that were not published yet", () => {
    expect(dueEntries(sched, new Date("2026-10-07T01:30:00Z")).map((e) => e.file)).toEqual(["a.md"]);
    expect(dueEntries(sched, new Date("2026-10-06T23:00:00Z"))).toEqual([]);
  });
});
