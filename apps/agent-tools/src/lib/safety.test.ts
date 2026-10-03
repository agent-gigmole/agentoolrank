import { describe, it, expect } from "vitest";
import { unsafeMatch } from "./safety";

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
