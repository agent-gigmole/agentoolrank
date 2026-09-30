// Maker outreach (T17): one personal, honest email per maintainer — their rank, their page, an optional
// README badge. No sales pitch. Sending is capped per day and needs owner-approved template.
export function badgeMarkdown(baseUrl: string, slug: string, name: string): string {
  return `[![${name} on AgentoolRank](${baseUrl}/api/badge/${slug})](${baseUrl}/tool/${slug})`;
}

export function outreachEmail(
  t: { owner: string; name: string; slug: string; rank: number; total: number; category: string },
  baseUrl: string,
): { subject: string; text: string } {
  return {
    subject: `${t.name} is #${t.rank} of ${t.total} in ${t.category} on AgentoolRank`,
    text: [
      `Hi ${t.owner},`,
      "",
      `I run AgentoolRank, an index that ranks open-source AI agent tools by live GitHub activity (stars, 30-day growth, commits, releases). ${t.name} is currently #${t.rank} of ${t.total} in ${t.category}:`,
      `${baseUrl}/tool/${t.slug}?ref=outreach`,
      "",
      "If it's useful, this README badge shows your live star count and links to that page:",
      "",
      badgeMarkdown(baseUrl, t.slug, t.name),
      "",
      `The page also lists alternatives and side-by-side comparisons. If anything about ${t.name} is wrong or outdated, just reply and I'll fix it.`,
      "",
      "Ethan Tan",
      "AgentoolRank · https://agentoolrank.com",
      "",
      'If you\'d rather not get email from me, reply "no" and I won\'t write again.',
    ].join("\n"),
  };
}
