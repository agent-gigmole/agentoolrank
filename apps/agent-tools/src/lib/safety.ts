// Categories AgentoolRank never lists (face swap / deepfake, nudify, adult, and tools for evading AI-text detection
// or academic cheating — agentkit 10-03 17:43 after new_ladar caught turnitin0.com). Matches joined and split spellings
// ("swapface", "face-swap", "replaces faces"), since domains and repo names glue words together (new_ladar 9ad81b0).
const UNSAFE = [
  /(?<!sur|inter|type)face[\s_.-]*swap/i, // not "surface/interface swap"; still catches glued "aifaceswap"
  /swap[\s_.-]*(?:my[\s_.-]*)?faces?/i,
  /replac\w*\s+(?:the\s+|a\s+|any\s+)?faces?\b/i,
  /deep[\s_.-]*fakes?/i,
  /deep[\s_.-]*face[\s_.-]*lab/i,
  /nudif/i,
  /undress/i,
  /cloth(?:es|ing)?[\s_.-]*remov/i,
  /remov\w*[\s_.-]*cloth/i,
  /nsfw/i,
  /porn/i,
  /hentai/i,
  /\bnudes?\b|\bnude[\s_.-]/i,
  /\bnaked\b/i,
  /\berotic/i,
  /\bsexting\b|\bsex[\s_.-]*(?:chat|bot|ai)\b/i,
  /ai[\s_.-]*girl[\s_.-]*friend/i,
  /onlyfans/i,
  // AI-detection evasion / academic cheating. Detectors themselves (and LMS integrations) are fine; evading them is not.
  /(?:bypass|evade|avoid|beat|fool|trick|pass)\w*[\s_.-]+(?:\w+[\s_.-]+){0,2}?(?:ai[\s_.-]*(?:text[\s_.-]*|content[\s_.-]*|writing[\s_.-]*)?detect\w*|turnitin|gptzero|zerogpt|originality\.ai|copyleaks)/i,
  /undetectable[\s_.-]*(?:by[\s_.-]*)?ai\b|\bai[\s_.-]*undetectable/i,
  /humani[sz](?:e|er|ing)[\s_.-]+(?:\w+[\s_.-]+)?(?:ai|chatgpt|gpt)\b|\bai[\s_.-]*humani[sz]er/i,
  /(?:lower|reduce|decrease|cut)\w*[\s_.-]+(?:\w+[\s_.-]+){0,2}?ai[\s_.-]*(?:detection[\s_.-]*)?(?:score|rate|percentage)/i,
  /turnitin[\s_.-]*(?:\d|bypass|remover)/i,
  /write[\s_.-]+my[\s_.-]+(?:essay|paper|thesis|assignment)|essay[\s_.-]*writing[\s_.-]*service|ghost[\s_.-]*writ\w*[\s_.-]+(?:essays?|thesis|papers?)/i,
  /cheat\w*[\s_.-]+(?:on|in)[\s_.-]+(?:\w+[\s_.-]+)?(?:exams?|tests?|quiz\w*)|(?:exam|test|quiz)[\s_.-]*cheat/i,
  /降低?.{0,6}AI.{0,4}(?:检测|率|痕迹)|降\s*AI\s*率|规避.{0,6}(?:AI|检测|查重)|论文代写|代写论文|绕过.{0,4}(?:检测|查重)/i,
];

/** Returns the matched text if `text` describes a tool in a category we never list, else null. */
export function unsafeMatch(text: string): string | null {
  for (const re of UNSAFE) {
    const m = text.match(re);
    if (m) return m[0];
  }
  return null;
}

// Scam-funnel templates (agentkit 10-04 03:15, new_ladar first screening night): clusters of "XXX AI — AI Platform for
// Intelligent Capital Preservation" sites with random names, same title in many languages. An LLM asked "is this an AI
// tool?" lets them through, so these are deterministic rejects.
const SCAM = [
  /\bAI\s+(?:platform|system|engine)\s+for\s+(?:\w+\s+){0,2}(?:capital|wealth|asset|investment|trading|profit)/i,
  /capital[\s_.-]+preservation/i,
  /guaranteed[\s_.-]+(?:\w+[\s_.-]+)?(?:returns?|profits?|income)/i,
  /(?:daily|weekly|passive)[\s_.-]+(?:returns?|profits?|income)/i,
];

/** Returns the matched text if `text` reads like an investment-scam funnel, else null. */
export function scamMatch(text: string): string | null {
  for (const re of SCAM) {
    const m = text.match(re);
    if (m) return m[0];
  }
  return null;
}

const host = (u: string | null | undefined) => {
  try {
    return new URL(u ?? "").hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
};

/**
 * Reasons to hold a submission for a human instead of approving it automatically:
 * a bare-IP / wildcard-DNS host (sslip.io, nip.io), or a name that is already a listed tool's name on a different
 * domain and repo (possible impersonation). Empty array = nothing suspicious.
 */
export function holdReasons(
  s: { name: string; url: string; github_url?: string | null },
  listed: Array<{ name: string; website_url?: string | null; github_url?: string | null }>,
): string[] {
  const out: string[] = [];
  const h = host(s.url);
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(h) || /(?:^|\.)(?:sslip\.io|nip\.io|xip\.io)$/.test(h)) out.push(`bare-IP host ${h}`);
  const name = s.name.trim().toLowerCase();
  const gh = (s.github_url ?? "").toLowerCase().replace(/\/+$/, "");
  for (const t of listed) {
    if (t.name.trim().toLowerCase() !== name) continue;
    const sameSite = h && host(t.website_url) === h;
    const sameRepo = gh && (t.github_url ?? "").toLowerCase().replace(/\/+$/, "") === gh;
    if (!sameSite && !sameRepo) out.push(`name matches listed tool "${t.name}" on another domain`);
  }
  return out;
}
