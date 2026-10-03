import { describe, it, expect } from "vitest";
import { unsafeMatch, scamMatch, holdReasons } from "./safety";

describe("unsafeMatch", () => {
  it.each([
    "aiswapface.org",
    "Face Swap AI online",
    "face-swap video",
    "FaceSwapper pro",
    "Instantly replaces faces in any video",
    "replace the face in photos",
    "deepfake studio",
    "aifaceswap.io",
    "DeepFaceLab",
    "AI nudify app",
    "undress any photo",
    "clothes remover AI",
    "NSFW image generator",
    "uncensored AI girlfriend",
    "porn generator",
    "nude photo maker",
  ])("flags %s", (s) => {
    expect(unsafeMatch(s)).not.toBeNull();
  });
  it.each([
    "Jailbreak and prompt injection protection",
    "Stealth Chromium that passes bot detection",
    "Voice cloning for personalized TTS",
    "Surface swap memory for agents",
    "Interface for face detection in security cameras",
    "Adultery-free wording test: adulterated data cleaning",
    "Hot swap models without restarts",
    "Interface swap for typeface swapping",
  ])("leaves %s alone", (s) => {
    expect(unsafeMatch(s)).toBeNull();
  });
});

describe("unsafeMatch: AI-detection evasion and academic cheating (agentkit 10-03 17:43, turnitin0.com)", () => {
  it.each([
    "Lower your AI detection score in one click",
    "Humanize AI text to bypass detectors",
    "Undetectable AI writer",
    "Bypass Turnitin and GPTZero",
    "turnitin0.com",
    "AI humanizer for essays",
    "Beat AI detection on every essay",
    "write my essay for me",
    "一键降低 AI 检测率",
    "降AI率，规避AI检测",
    "论文代写",
    "cheat on online exams with AI",
  ])("blocks %s", (t) => expect(unsafeMatch(t)).not.toBeNull());

  it.each([
    "AI content detector for teachers",
    "Detect AI-generated text in submissions",
    "Turnitin LMS integration guide",
    "Humanoid robot agent framework",
    "Bypass rate limits with a proxy pool",
    "Essay grading assistant for teachers",
  ])("allows %s", (t) => expect(unsafeMatch(t)).toBeNull());
});


describe("scamMatch (investment-scam funnel templates, agentkit 10-04)", () => {
  it("catches the capital-preservation template and return promises", () => {
    expect(scamMatch("Zvaklurenatrx AI — AI Platform for Intelligent Capital Preservation")).not.toBeNull();
    expect(scamMatch("Earn guaranteed daily returns with our bot")).not.toBeNull();
    expect(scamMatch("Passive income on autopilot")).not.toBeNull();
  });
  it("leaves real trading / finance agent tools alone", () => {
    expect(scamMatch("Open source software that helps you create and deploy high-frequency crypto trading bots")).toBeNull();
    expect(scamMatch("Value investing research framework for Claude Code and Codex")).toBeNull();
    expect(scamMatch("Self-hosted AI trading platform for Python strategies, backtesting, and paper trading")).toBeNull();
  });
});

describe("holdReasons (hold for a human, never auto-approve)", () => {
  const listed = [{ name: "CrewAI", website_url: "https://crewai.com", github_url: "https://github.com/crewAIInc/crewAI" }];
  it("holds bare-IP and wildcard-DNS hosts", () => {
    expect(holdReasons({ name: "x", url: "https://95.216.126.169.sslip.io/buyer" }, [])).toHaveLength(1);
    expect(holdReasons({ name: "x", url: "http://10.0.0.1/" }, [])).toHaveLength(1);
  });
  it("holds a listed tool's name on another domain and repo (impersonation)", () => {
    expect(holdReasons({ name: "crewai", url: "https://crewai-pro.xyz" }, listed)).toHaveLength(1);
  });
  it("passes the real site, the real repo, and unrelated names", () => {
    expect(holdReasons({ name: "CrewAI", url: "https://www.crewai.com/" }, listed)).toEqual([]);
    expect(holdReasons({ name: "CrewAI", url: "https://docs.example.com", github_url: "https://github.com/crewAIInc/crewAI/" }, listed)).toEqual([]);
    expect(holdReasons({ name: "Legba", url: "https://legba.app" }, listed)).toEqual([]);
  });
});
