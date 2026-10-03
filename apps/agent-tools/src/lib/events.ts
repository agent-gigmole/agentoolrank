// First-party analytics: the browser posts small events to /api/e, stored in our own DB.
// No third-party script (blocked by ad blockers, and one less vendor).

// page_view / engagement / ui_click / exit_survey follow agentkit's visitor-insights spec (same names and privacy rules
// as the other projects); the rest is our own funnel.
export const EVENT_NAMES = [
  "page_view", "engagement", "ui_click", "exit_survey", "element_seen",
  "submit_done", "outbound_click", "badge_copy", "checkout_click", "maintainer_banner_click", "kit_click",
] as const;
export const SURVEY_REASONS = ["browsing", "later", "price", "unclear", "privacy", "other"] as const;
export type EventName = (typeof EVENT_NAMES)[number];

export interface AnalyticsEvent {
  name: EventName;
  path: string;
  ref: string; // referrer host, "" for direct / internal
  src: string; // utm source/medium/campaign or ?ref=
  sid: string; // random per-session id, not a user id
  props: string; // JSON of whitelisted, bounded fields only (never typed text or emails)
}

const int = (v: unknown, max: number) => (typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(max, Math.round(v))) : undefined);

/** Keeps only the visitor-insights fields, each bounded: a label is a data-testid, an internal path or "external". */
export function cleanProps(raw: unknown): Record<string, string | number | boolean> {
  if (typeof raw !== "object" || raw === null) return {};
  const r = raw as Record<string, unknown>;
  const out: Record<string, string | number | boolean> = {};
  const seconds = int(r.seconds, 86_400);
  if (seconds !== undefined) out.seconds = seconds;
  const scroll = int(r.scroll, 100);
  if (scroll !== undefined) out.scroll = scroll;
  if (typeof r.label === "string" && /^(external|#anchor|mailto|tel|\/[\w\-./]{0,80}|[a-z0-9][a-z0-9_-]{0,60})$/i.test(r.label)) out.label = r.label;
  if (typeof r.action === "string" && ["shown", "dismiss", "answer"].includes(r.action)) out.action = r.action;
  if (typeof r.reason === "string" && (SURVEY_REASONS as readonly string[]).includes(r.reason)) out.reason = r.reason;
  if (typeof r.touch === "boolean") out.touch = r.touch;
  if (typeof r.element === "string" && /^[a-z][a-z0-9_]{0,39}$/.test(r.element)) out.element = r.element;
  return out;
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
    props: JSON.stringify(cleanProps(b.props)),
  };
}

/** Scroll depth in %; a page that fits on screen counts as 100% (visitor-insights rule shared by every project). */
export function scrollPercent(scrollY: number, scrollHeight: number, viewportHeight: number): number {
  const h = scrollHeight - viewportHeight;
  // Tolerance: a page at most max(48 px, 10% of the screen) taller than the viewport was seen in full without scrolling.
  return h <= Math.max(48, viewportHeight * 0.1) ? 100 : Math.min(100, Math.max(0, Math.round((scrollY / h) * 100)));
}

/** ui_click label: data-testid, else same-origin path, "#anchor", "mailto", "tel" or "external" — never link text. */
export function clickLabel(testId: string | null, href: string | null, origin: string): string {
  if (testId) return testId;
  if (!href) return "";
  if (href.startsWith("#")) return "#anchor";
  if (/^mailto:/i.test(href)) return "mailto";
  if (/^tel:/i.test(href)) return "tel";
  try {
    const u = new URL(href, origin);
    return u.origin === origin ? u.pathname : "external";
  } catch {
    return "";
  }
}

/** element_seen fires when an element marked data-vi-seen="name" is at least this much on screen, once per session. */
export const SEEN_RATIO = 0.5;
export function firstSighting(name: string, ratio: number, store: { getItem(k: string): string | null; setItem(k: string, v: string): void }): boolean {
  if (ratio < SEEN_RATIO) return false;
  const key = `at_seen_${name}`;
  if (store.getItem(key) === "1") return false;
  store.setItem(key, "1");
  return true;
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
