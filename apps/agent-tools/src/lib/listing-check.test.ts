import { describe, expect, it } from "vitest";
import { candidateUrls, findBacklink, knownListingUrl } from "./listing-check";

describe("knownListingUrl", () => {
  it("takes the first URL on the directory's own host from our log detail", () => {
    expect(knownListingUrl("launchboosts.com", "【已上线】https://launchboosts.com/project/agentoolrank（Free 档）")).toBe("https://launchboosts.com/project/agentoolrank");
    expect(knownListingUrl("conduid.com", "see https://www.conduid.com/servers/agentoolrank, ok")).toBe("https://www.conduid.com/servers/agentoolrank");
    expect(knownListingUrl("x.com", "submitted via https://other.com/form")).toBeNull();
  });
});

describe("candidateUrls", () => {
  it("prefers the known URL and otherwise tries the usual listing paths", () => {
    expect(candidateUrls("a.com", "https://a.com/p/agentoolrank")).toEqual(["https://a.com/p/agentoolrank"]);
    const guesses = candidateUrls("a.com", null);
    expect(guesses).toContain("https://a.com/tool/agentoolrank");
    expect(guesses).toContain("https://a.com/tools/agentoolrank");
    expect(guesses.length).toBeLessThanOrEqual(8);
  });
});

describe("findBacklink", () => {
  it("finds our link and reads its rel", () => {
    expect(findBacklink('<a href="https://agentoolrank.com/?ref=x" rel="nofollow noopener">Visit</a>')).toEqual({ found: true, rel: "nofollow noopener" });
    expect(findBacklink("<a rel='ugc' class=b href='https://www.agentoolrank.com'>x</a>")).toEqual({ found: true, rel: "ugc" });
    expect(findBacklink('<a href="https://agentoolrank.com">x</a>')).toEqual({ found: true, rel: "dofollow" });
  });
  it("does not count a bare mention or another site", () => {
    expect(findBacklink("AgentoolRank is listed here: agentoolrank.com")).toEqual({ found: false, rel: null });
    expect(findBacklink('<a href="https://notagentoolrank.com.evil.io">x</a>')).toEqual({ found: false, rel: null });
  });
});
