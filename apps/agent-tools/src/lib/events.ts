// First-party analytics: the browser posts small events to /api/e, stored in our own DB.
// No third-party script (blocked by ad blockers, and one less vendor).

export const EVENT_NAMES = ["page_view", "submit_done", "outbound_click", "badge_copy", "checkout_click", "maintainer_banner_click"] as const;
export type EventName = (typeof EVENT_NAMES)[number];

export interface AnalyticsEvent {
  name: EventName;
  path: string;
  ref: string; // referrer host, "" for direct / internal
  src: string; // utm source/medium/campaign or ?ref=
  sid: string; // random per-session id, not a user id
}

const SITE_HOSTS = ["agentoolrank.com", "www.agentoolrank.com"];
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : null);

function refHost(raw: string): string {
  try {
    const host = new URL(raw).hostname.replace(/^www\./, "");
    return SITE_HOSTS.includes(host) || SITE_HOSTS.includes(`www.${host}`) ? "" : host;
  } catch {
    return "";
  }
}

export function parseEvent(body: unknown): AnalyticsEvent | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;
  const name = str(b.n, 40);
  const rawPath = str(b.p, 2000);
  if (!name || !(EVENT_NAMES as readonly string[]).includes(name) || rawPath === null) return null;
  return {
    name: name as EventName,
    path: rawPath.split(/[?#]/)[0].slice(0, 200) || "/",
    ref: refHost(str(b.r, 500) ?? ""),
    src: str(b.s, 120) ?? "",
    sid: str(b.sid, 40) ?? "",
  };
}

export function isBotUserAgent(ua: string): boolean {
  return !ua || /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|curl|wget|python|node-fetch|axios/i.test(ua);
}

export function sourceFromUrl(href: string): string {
  try {
    const q = new URL(href).searchParams;
    const utm = ["utm_source", "utm_medium", "utm_campaign"].map((k) => q.get(k) ?? "").filter(Boolean);
    if (utm.length) return utm.join("/");
    return q.get("ref") ?? "";
  } catch {
    return "";
  }
}
