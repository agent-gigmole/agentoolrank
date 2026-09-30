// Contact emails that maintainers themselves publish on their project website or README
// (GitHub's terms forbid using GitHub profile data for unsolicited email).
// Role inboxes meant for one purpose (vulnerability reports, legal, hiring…) are not for outreach.
const ROLE = /^(security|secure|vuln|abuse|legal|license|licensing|privacy|gdpr|dpo|careers|jobs|hr|recruit|billing|invoice|press|dmca|compliance|trust)[@.+]/i;
const BAD = /(noreply|no-reply|donotreply|example\.(com|org)|sentry|wixpress|\.(png|jpe?g|gif|svg|webp)$|@\dx\.)/i;

export function extractContactEmails(text: string, preferDomain?: string): string[] {
  const found = new Set<string>();
  for (const m of text.matchAll(/(?:mailto:)?([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g)) {
    const e = m[1].toLowerCase().replace(/\.$/, "");
    if (!BAD.test(e) && !ROLE.test(e)) found.add(e);
  }
  const list = [...found];
  if (!preferDomain) return list;
  const d = preferDomain.toLowerCase().replace(/^www\./, "");
  return [...list.filter((e) => e.endsWith(`@${d}`) || e.endsWith(`.${d}`)), ...list.filter((e) => !(e.endsWith(`@${d}`) || e.endsWith(`.${d}`)))];
}
