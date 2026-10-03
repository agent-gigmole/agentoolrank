import { describe, expect, it } from "vitest";
import { npmNameFromPackageJson, pypiNameFromPyproject, pypiNameFromSetupPy, repoMatches, githubRepo } from "./downloads";

describe("package name discovery from the tool's own repo", () => {
  it("reads package.json, skipping private roots", () => {
    expect(npmNameFromPackageJson('{"name":"@mastra/core","version":"1.0.0"}')).toBe("@mastra/core");
    expect(npmNameFromPackageJson('{"name":"monorepo-root","private":true}')).toBeNull();
    expect(npmNameFromPackageJson("not json")).toBeNull();
  });
  it("reads pyproject [project] or [tool.poetry] name", () => {
    expect(pypiNameFromPyproject('[build-system]\nrequires=["x"]\n\n[project]\nname = "crewai"\nversion="1"')).toBe("crewai");
    expect(pypiNameFromPyproject('[tool.poetry]\nname = "langchain-core"\n')).toBe("langchain-core");
    expect(pypiNameFromPyproject('[tool.ruff]\nline-length=100')).toBeNull();
  });
  it("reads a literal name from setup.py only", () => {
    expect(pypiNameFromSetupPy('setup(\n  name="autogen",\n  version=v)')).toBe("autogen");
    expect(pypiNameFromSetupPy("setup(name=NAME)")).toBeNull();
  });
});

describe("repoMatches (avoid crediting a same-named package from someone else)", () => {
  it("accepts only metadata pointing at the same GitHub repo", () => {
    expect(repoMatches("git+https://github.com/crewAIInc/crewAI.git", "crewaiinc", "crewai")).toBe(true);
    expect(repoMatches("https://github.com/someone/crewai-clone", "crewaiinc", "crewai")).toBe(false);
    expect(repoMatches(undefined, "a", "b")).toBe(false);
  });
  it("parses owner/repo from a GitHub URL", () => {
    expect(githubRepo("https://github.com/langchain-ai/langchain")).toEqual({ owner: "langchain-ai", repo: "langchain" });
    expect(githubRepo("https://example.com/x")).toBeNull();
  });
});

describe("candidateNames", () => {
  it("tries the manifest name, its -workspace stem, repo name, tool id/name and @repo/core, deduped", async () => {
    const { candidateNames } = await import("./downloads");
    expect(candidateNames({ manifest: "crewai-workspace", repo: "crewAI", id: "crewai", name: "CrewAI" }, "pypi")).toEqual(["crewai-workspace", "crewai"]);
    expect(candidateNames({ manifest: null, repo: "mastra", id: "mastra", name: "Mastra" }, "npm")).toEqual(["mastra", "@mastra/core"]);
    expect(candidateNames({ manifest: null, repo: "langchainjs", id: "langchainjs", name: "LangChain.js" }, "npm")).toEqual(["langchainjs", "langchain.js", "@langchainjs/core", "langchain"]);
  });
});

describe("downloadsLine", () => {
  it("renders registry, package and a compact monthly count", async () => {
    const { downloadsLine } = await import("./downloads");
    expect(downloadsLine([{ registry: "pypi", package: "langchain", downloads_30d: 169366312 }, { registry: "npm", package: "@mastra/core", downloads_30d: 3093776 }])).toEqual([
      { label: "PyPI", pkg: "langchain", n: 169366312, value: "169.4M", url: "https://pypi.org/project/langchain/" },
      { label: "npm", pkg: "@mastra/core", n: 3093776, value: "3.1M", url: "https://www.npmjs.com/package/@mastra/core" },
    ]);
    expect(downloadsLine([{ registry: "npm", package: "x", downloads_30d: 950 }])[0].value).toBe("950");
    expect(downloadsLine([{ registry: "npm", package: "x", downloads_30d: 12500 }])[0].value).toBe("12.5K");
    expect(downloadsLine([{ registry: "npm", package: "x", downloads_30d: null }])).toEqual([]);
  });
});

describe("rankByDownloads", () => {
  it("sums registries per tool, sorts by total and computes downloads per star", async () => {
    const { rankByDownloads } = await import("./downloads");
    const r = rankByDownloads([
      { id: "a", name: "A", stars: 1000, registry: "npm", package: "a", downloads_30d: 5000 },
      { id: "b", name: "B", stars: 100, registry: "pypi", package: "b", downloads_30d: 9000 },
      { id: "a", name: "A", stars: 1000, registry: "pypi", package: "a-py", downloads_30d: 6000 },
      { id: "c", name: "C", stars: 50, registry: "npm", package: "c", downloads_30d: null },
    ]);
    expect(r.map((x) => [x.id, x.total])).toEqual([["a", 11000], ["b", 9000]]);
    expect(r[0].packages.map((p) => p.label)).toEqual(["PyPI", "npm"]);
    expect(r[1].perStar).toBe(90);
  });
});

describe("totalDownloads", () => {
  it("sums known counts and is null when the tool has no package count", async () => {
    const { totalDownloads } = await import("./downloads");
    expect(totalDownloads([{ downloads_30d: 10 }, { downloads_30d: 5 }])).toBe(15);
    expect(totalDownloads([{ downloads_30d: null }])).toBeNull();
    expect(totalDownloads([])).toBeNull();
  });
});

describe("usageVerdict", () => {
  it("names the most-downloaded tool and, if different, the most-starred one", async () => {
    const { usageVerdict } = await import("./downloads");
    expect(usageVerdict([
      { name: "A", stars: 50000, downloads: 1_000_000 },
      { name: "B", stars: 9000, downloads: 40_000_000 },
      { name: "C", stars: 100, downloads: null },
    ])).toBe("By package downloads B is the most used here (40.0M in the last 30 days), even though A has the most GitHub stars.");
    expect(usageVerdict([{ name: "A", stars: 5, downloads: 900 }, { name: "B", stars: 1, downloads: 10 }])).toBe("By package downloads A is the most used here (900 in the last 30 days), and it also has the most GitHub stars.");
  });
  it("says nothing when fewer than two tools have download counts", async () => {
    const { usageVerdict } = await import("./downloads");
    expect(usageVerdict([{ name: "A", stars: 5, downloads: 900 }, { name: "B", stars: 1, downloads: null }])).toBeNull();
  });
});

describe("usedMoreThanStarred", () => {
  it("ranks tools by downloads per star, only above a download floor so tiny packages don't win", async () => {
    const { usedMoreThanStarred } = await import("./downloads");
    const ranked = [
      { id: "a", name: "A", stars: 1000, total: 5_000_000, packages: [], perStar: 5000 },
      { id: "b", name: "B", stars: 10, total: 50_000, packages: [], perStar: 5000 },
      { id: "c", name: "C", stars: 100_000, total: 10_000_000, packages: [], perStar: 100 },
      { id: "d", name: "D", stars: null, total: 9_000_000, packages: [], perStar: null },
    ];
    expect(usedMoreThanStarred(ranked, 2).map((t) => t.id)).toEqual(["a", "c"]);
  });
});

describe("rankByDownloads with a category filter", () => {
  it("keeps only tools tagged with the category", async () => {
    const { rankByDownloads } = await import("./downloads");
    const rows = [
      { id: "a", name: "A", stars: 1, registry: "npm", package: "a", downloads_30d: 10, categories: ["agent-frameworks"] },
      { id: "b", name: "B", stars: 1, registry: "npm", package: "b", downloads_30d: 20, categories: ["mcp-servers"] },
    ];
    expect(rankByDownloads(rows, "mcp-servers").map((t) => t.id)).toEqual(["b"]);
    expect(rankByDownloads(rows).map((t) => t.id)).toEqual(["b", "a"]);
  });
});

describe("downloadCategorySlugs (one rule for page, sitemap and links)", () => {
  it("returns categories with at least DOWNLOAD_CATEGORY_MIN counted tools", async () => {
    const { downloadCategorySlugs, DOWNLOAD_CATEGORY_MIN } = await import("./downloads");
    const row = (id: string, cat: string) => ({ id, name: id, stars: 1, registry: "npm", package: id, downloads_30d: 5, categories: [cat] });
    const rows = [row("a", "x"), row("b", "x"), row("c", "x"), row("d", "y")];
    expect(DOWNLOAD_CATEGORY_MIN).toBe(3);
    expect([...downloadCategorySlugs(rows, ["x", "y"]).keys()]).toEqual(["x"]);
    expect(downloadCategorySlugs(rows, ["x", "y"]).get("x")).toBe(3);
  });
});

describe("downloadPairs", () => {
  it("pairs the top-N downloaded tools inside each category, slug-sorted and deduped", async () => {
    const { downloadPairs } = await import("./downloads");
    const row = (id: string, dl: number, cats: string[]) => ({ id, name: id, stars: 1, registry: "pypi", package: id, downloads_30d: dl, categories: cats });
    const rows = [row("b", 300, ["x"]), row("a", 200, ["x", "y"]), row("c", 100, ["x"]), row("d", 50, ["y"])];
    expect(downloadPairs(rows, ["x", "y"], 2).sort()).toEqual(["a-vs-b", "a-vs-d"]);
  });
});
