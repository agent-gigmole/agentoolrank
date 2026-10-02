// Categories AgentoolRank never lists (face swap / deepfake, nudify, adult). Matches joined and split spellings
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
];

/** Returns the matched text if `text` describes a tool in a category we never list, else null. */
export function unsafeMatch(text: string): string | null {
  for (const re of UNSAFE) {
    const m = text.match(re);
    if (m) return m[0];
  }
  return null;
}
