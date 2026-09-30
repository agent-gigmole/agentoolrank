import { describe, it, expect } from "vitest";
import { pickCandidates } from "./discover";

const repo = (full: string, stars: number, extra: Record<string, unknown> = {}) => ({
  full_name: full, stargazers_count: stars, fork: false, archived: false, description: "d", html_url: `https://github.com/${full}`, homepage: "", ...extra,
});

describe("pickCandidates", () => {
  it("dedupes, drops listed/forks/archived/awesome lists, sorts by stars, caps", () => {
    const repos = [
      repo("a/one", 900), repo("a/one", 900), repo("b/two", 5000), repo("c/listed", 3000),
      repo("d/forked", 800, { fork: true }), repo("e/old", 700, { archived: true }), repo("f/awesome-agents", 9000),
      repo("g/three", 400),
    ];
    const listed = new Set(["c/listed"]);
    expect(pickCandidates(repos, listed, 3).map((r) => r.full_name)).toEqual(["b/two", "a/one", "g/three"]);
  });

  it("matches listed repos case-insensitively", () => {
    expect(pickCandidates([repo("Foo/Bar", 1000)], new Set(["foo/bar"]), 10)).toEqual([]);
  });
});
