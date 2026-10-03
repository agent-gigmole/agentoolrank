// Copy check for anything posted on the owner's X / Reddit accounts (owner 10-03 16:31): the post speaks as the owner,
// so it must not say the post itself was written, generated or posted by AI / an agent / a scheduler.
// Talking about AI agents running a project (the series theme) or a product that updates itself is fine.
const PATTERNS: RegExp[] = [
  /\b(written|generated|drafted|posted|created)\s+(by|with)\s+(an?\s+)?(ai|gpt|chatgpt|claude|llm|bot|agent)\b/i,
  /\bmy\s+(ai\s+)?(agent|bot)\s+(wrote|posted|drafted|generated)\b/i,
  /\bauto[-\s]?(posted|generated|scheduled)\b/i,
  /\bposted\s+(automatically|on\s+a\s+schedule)\b/i,
  /\bthis\s+(post|tweet|thread)\s+(was|is)\s+(written|generated|posted|scheduled)\b/i,
  /本(帖|条|推)由\s*(AI|agent|机器人)/i,
  /这条(帖子|推文|内容)?\s*(是|由)\s*(AI|agent|机器人)/i,
  /(AI|agent|机器人)\s*(写|发|生成)的/i,
  /自动生成/,
  /定时发布/,
];

/** The first phrase that says the post is AI-written or auto-posted, or null if the copy is clean. */
export function aiAuthorshipMatch(text: string): string | null {
  for (const re of PATTERNS) {
    const m = re.exec(text);
    if (m) return m[0];
  }
  return null;
}
