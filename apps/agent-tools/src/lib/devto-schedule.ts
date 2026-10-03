// dev.to scheduled publishing (pipeline, owner rule "process as code"): ops/devto-schedule.json lists drafts with a
// publish time; the hourly run posts the ones that are due and records their URL so nothing posts twice.
export interface DevtoEntry { file: string; publish_at: string; tags: string[]; url?: string; series?: string }

export function splitTitle(md: string): { title: string; body: string } {
  const m = /^#\s+(.+)\n+/.exec(md);
  if (!m) throw new Error("draft has no H1 title on its first line");
  return { title: m[1].trim(), body: md.slice(m[0].length) };
}

export function dueEntries(entries: DevtoEntry[], now: Date): DevtoEntry[] {
  return entries.filter((e) => !e.url && Date.parse(e.publish_at) <= now.getTime());
}
