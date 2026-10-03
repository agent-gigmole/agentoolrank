// Cross-project feedback inbox (~/data/feedback/feedback.jsonl, append-only; last line per id wins).
// agentkit's rule-check wants every ai-directory entry decided within 48 hours.
export const PROJECT = "ai-directory";
const OWN = new Set(["agentoolrank", "agent-gigmole"]);

export interface FeedbackRow { id: string; project?: string; status?: string; collected_at?: number; [k: string]: unknown }
export interface Found { id: string; author: string; url?: string; text?: string }

export function currentById<T extends { id: string }>(rows: T[]): Map<string, T> {
  const m = new Map<string, T>();
  for (const r of rows) m.set(r.id, r);
  return m;
}

export function newFeedback<T extends Found>(known: Set<string>, found: T[]): T[] {
  return found.filter((f) => !known.has(f.id) && !OWN.has(f.author.toLowerCase()));
}

interface DevtoComment { id_code: string; body_html: string; user: { username: string }; children: DevtoComment[] }
const text = (html: string) => html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 1000);

export function devtoComments(_articleId: number, articleUrl: string, comments: DevtoComment[]): Found[] {
  return comments.flatMap((c) => [
    { id: `devto:${c.id_code}`, url: `${articleUrl}#comment-${c.id_code}`, author: c.user.username, text: text(c.body_html) },
    ...devtoComments(_articleId, articleUrl, c.children ?? []),
  ]);
}

export function overdue(rows: FeedbackRow[], nowSec: number): FeedbackRow[] {
  return [...currentById(rows).values()].filter(
    (r) => r.project === PROJECT && r.status === "new" && nowSec - Number(r.collected_at ?? nowSec) > 48 * 3600,
  );
}

const addr = (from: string) => (/<([^>]+)>/.exec(from)?.[1] ?? from).trim().toLowerCase();
const AUTOMATED = /(^|[._-])(no-?reply|notifications?|alerts?|account-alerts|mailer-daemon|postmaster|bounce)([._@-]|$)|@(t\.)?brevo\.com$|@stripe\.com$|@(.+\.)?google\.com$/;

/** A reply worth reading: from someone we emailed, or a human "Re:" — not directory notices, magic links or alerts. */
export function humanReply(m: { from: string; subject: string }, sentTo: Set<string>): boolean {
  const a = addr(m.from);
  if (AUTOMATED.test(a)) return false;
  return sentTo.has(a) || /^\s*re:/i.test(m.subject);
}

/** "no" / "unsubscribe" as the first words of a reply: never email them again (promise in every outreach email). */
export function isOptOut(body: string): boolean {
  return /^\s*(no\b|unsubscribe\b|remove me\b|stop\b)/i.test(body);
}

export const senderAddress = addr;
