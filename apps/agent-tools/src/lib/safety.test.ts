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
