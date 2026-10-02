// Maker outreach (T17): one personal, honest email per maintainer — their rank, their page, an optional
// README badge. No sales pitch. Sending is capped per day and needs owner-approved template.
export function badgeMarkdown(baseUrl: string, slug: string, name: string): string {
  return `[![${name} on AgentoolRank](${baseUrl}/api/badge/${slug})](${baseUrl}/tool/${slug})`;
}

// Wording from the content-writing skill (docs/ops/launch-kit/drafts/outreach-maker-v2.md, brief in briefs/outreach-maker.md).
export function outreachEmail(
  t: { owner: string; name: string; slug: string; rank: number; total: number; category: string },
  baseUrl: string,
): { subject: string; text: string } {
  return {
    subject: `${t.name}'s current rank on AgentoolRank`,
    text: [
      `Hi ${t.owner},`,
      "",
      `${t.name} is currently #${t.rank} of ${t.total} in ${t.category} on AgentoolRank, ranked by live GitHub activity. I built AgentoolRank.`,
      "",
      `Could you check ${baseUrl}/tool/${t.slug}?ref=outreach ? It shows your project's stats, alternatives and side-by-side comparisons, with data refreshed daily.`,
      "",
      "If you'd like a README badge, this shows the live star count and links to your page:",
      badgeMarkdown(baseUrl, t.slug, t.name),
      "",
      `If anything about ${t.name} is wrong or outdated, you can reply with corrections and I'll fix it. Both are optional.`,
      "",
      "Jason T.",
      "AgentoolRank",
      "https://agentoolrank.com",
      "",
      'If you reply "no", we\'ll never email you again.',
    ].join("\n"),
  };
}
