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
