// Maker outreach (T17): one personal, honest email per maintainer — their rank, their page, an optional
// README badge. No sales pitch. Sending is capped per day and needs owner-approved template.
export function badgeMarkdown(baseUrl: string, slug: string, name: string, metric?: "downloads"): string {
  const q = metric ? `?metric=${metric}` : "";
  return `[![${name}${metric ? " downloads" : ""} on AgentoolRank](${baseUrl}/api/badge/${slug}${q})](${baseUrl}/tool/${slug})`;
}

// Wording from the content-writing skill (docs/ops/launch-kit/drafts/outreach-maker-v2.md, brief in briefs/outreach-maker.md).
export function outreachEmail(
  t: { owner: string; name: string; slug: string; rank: number; total: number; category: string; downloads?: { label: string; pkg: string; value: string; n?: number }; variant?: "A" | "B" },
  baseUrl: string,
): { subject: string; text: string } {
  return {
    subject: t.variant === "B" ? `${t.name} is #${t.rank} of ${t.total} in ${t.category} (data inside)` : `${t.name}'s current rank on AgentoolRank`,
    text: [
      `Hi ${t.owner},`,
      "",
      `${t.name} is currently #${t.rank} of ${t.total} in ${t.category} on AgentoolRank, ranked by live GitHub activity. I built AgentoolRank.`,
      "",
      `Could you check ${baseUrl}/tool/${t.slug}?ref=outreach${t.variant ? `-${t.variant.toLowerCase()}` : ""} ? It shows your project's stats, alternatives and side-by-side comparisons, with data refreshed daily.`,
      "",
      ...(t.downloads
        ? [`Its ${t.downloads.label} package ${t.downloads.pkg} had ${t.downloads.value} downloads in the last 30 days; the page shows that next to stars (${baseUrl}/downloads).`, ""]
        : []),
      ...((t.downloads?.n ?? 0) >= 100_000
        ? ["If you'd like a README badge, this one shows the live monthly downloads and links to your page:", badgeMarkdown(baseUrl, t.slug, t.name, "downloads")]
        : ["If you'd like a README badge, this shows the live star count and links to your page:", badgeMarkdown(baseUrl, t.slug, t.name)]),
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

/** Google DNS-over-HTTPS MX answer. Used to confirm a local "no MX" (the WSL resolver has returned empty for domains
 *  that do have MX, e.g. cherry-ai.com on Feishu), so nobody is opted out on a local resolver glitch. */
export function dohMxVerdict(j: { Status?: number; Answer?: { type: number; data?: string }[] } | null): "ok" | "none" | "unknown" {
  if (!j || typeof j.Status !== "number") return "unknown";
  if (j.Status === 3) return "none";
  if (j.Status !== 0) return "unknown";
  return (j.Answer ?? []).some((a) => a.type === 15) ? "ok" : "none";
}

export function uniqueByEmail<T extends { email: string }>(list: T[]): T[] {
  const seen = new Set<string>();
  return list.filter((c) => {
    const k = c.email.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Weekly bet 1 (docs/ops/weekly/2026-10-05.md): 10/day → 15 from 10-08 → 20 from 10-12, only while the last 7 days
 *  had 0 bounces / blocks / spam / invalid on our tag (clean = sendingBlocked(...) === null). China-time day "YYYY-MM-DD". */
export function dailyCap(day: string, clean: boolean): number {
  if (!clean) return 10;
  if (day >= "2026-10-12") return 20;
  if (day >= "2026-10-08") return 15;
  return 10;
}

/** Subject A/B: a stable half of addresses (by hash) gets variant B. Results are read per Brevo tag (outreach-a / outreach-b). */
export function subjectVariant(email: string): "A" | "B" {
  let h = 0;
  for (const ch of email.toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % 2 === 0 ? "A" : "B";
}
