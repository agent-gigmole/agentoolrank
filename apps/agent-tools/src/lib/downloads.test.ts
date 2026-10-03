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
