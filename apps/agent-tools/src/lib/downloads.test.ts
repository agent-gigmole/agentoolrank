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
