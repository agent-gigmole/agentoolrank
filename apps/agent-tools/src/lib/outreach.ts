// Maker outreach (T17): one personal, honest email per maintainer — their rank, their page, an optional
// README badge. No sales pitch. Sending is capped per day and needs owner-approved template.
export function badgeMarkdown(baseUrl: string, slug: string, name: string): string {
  return `[![${name} on AgentoolRank](${baseUrl}/api/badge/${slug})](${baseUrl}/tool/${slug})`;
}

// Wording from the content-writing skill (docs/ops/launch-kit/drafts/outreach-maker-v2.md, brief in briefs/outreach-maker.md).
export function outreachEmail(
  t: { owner: string; name: string; slug: string; rank: number; total: number; category: string; downloads?: { label: string; pkg: string; value: string } },
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
      ...(t.downloads
        ? [`Its ${t.downloads.label} package ${t.downloads.pkg} had ${t.downloads.value} downloads in the last 30 days; the page shows that next to stars (${baseUrl}/downloads).`, ""]
        : []),
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

/** Mailing lists and broadcast/no-reply inboxes: one "personal" email there reaches many people, so never send. */
export function isGroupAddress(email: string): boolean {
  const [local = "", domain = ""] = email.toLowerCase().split("@");
  if (/(^|\.)googlegroups\.com$|^lists?\.|^groups\.|\.groups\.io$|^groups\.io$/.test(domain)) return true;
  return /(^|[-_.])(users|dev|devel|discuss|announce|list|no-?reply)($|[-_.])/.test(local);
}

export interface BrevoStats { hardBounces?: number; softBounces?: number; blocked?: number; spamReports?: number; invalid?: number }

/**
 * Nightly pipeline gate (7-day Brevo stats): our own tag must be spotless; on the shared account, any spam report or
 * block stops us too (it hurts everyone's sending reputation). Another project's single bounce does not.
 */
export function sendingBlocked(outreach: BrevoStats, account: BrevoStats): string | null {
  const ours = (outreach.hardBounces ?? 0) + (outreach.softBounces ?? 0) + (outreach.blocked ?? 0) + (outreach.spamReports ?? 0) + (outreach.invalid ?? 0);
  if (ours > 0) return `outreach tag has ${ours} bounce/block/spam/invalid in 7 days`;
  const shared = (account.spamReports ?? 0) + (account.blocked ?? 0);
  if (shared > 0) return `shared Brevo account has ${shared} spam report/block in 7 days`;
  return null;
}

/** Per-address check before sending: the domain must accept mail (MX), and Brevo must not have blocked the address
 *  for any project on the shared account (a dead mailbox can still sit on a domain with MX). */
export function preflightSkip(email: string, mxRecords: number, blocked: Set<string>): string | null {
  if (mxRecords < 1) return "domain has no MX record";
  if (blocked.has(email.toLowerCase())) return "address is in the shared Brevo account's blocked contacts";
  return null;
}

/** MX lookup result: only a definite "no such domain / no MX" counts as none; timeouts and server failures are unknown. */
export function mxVerdict(r: { records?: number; error?: string }): "ok" | "none" | "unknown" {
  if (r.error) return r.error === "ENOTFOUND" || r.error === "ENODATA" ? "none" : "unknown";
  return (r.records ?? 0) > 0 ? "ok" : "none";
}
