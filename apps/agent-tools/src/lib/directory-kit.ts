// Submit Kit: recommend directories for a product from what our own projects measured on each site
// (src/lib/directory-kit-data.json, built by scripts/export-directory-kit.ts). Server-side only.
export interface KitSite {
  domain: string;
  accepts: string[]; // ai_tools | mcp_servers | dev_tools | saas | startups_general | open_source_only | regional
  language: string;
  free: "yes" | "no" | "unknown";
  conditions: string[]; // queue | badge | backlink | x_post | vote_or_review_others | call
  queue: string | null;
  paidFrom: number | null;
  link: string; // dofollow | nofollow | ugc | unknown (measured by us; unknown = not checked)
  login: string[];
  captcha: string;
  human: string[]; // steps only a person can do: email_inbox | captcha | real_name | phone | payment | x_post | video_call
  tips: string[];
  success: string | null;
  outcome: string;
  verified: string;
}
export interface KitAvoid { domain: string; reason: string; detail: string }
export interface KitData { generated: string; sites: KitSite[]; avoid: KitAvoid[] }

export type ProductType = "ai_tool" | "mcp_server" | "dev_tool" | "saas" | "other";
export type Tier = "auto" | "manual" | "avoid";

const FITS: Record<ProductType, string[]> = {
  ai_tool: ["ai_tools", "startups_general", "saas"],
  mcp_server: ["mcp_servers", "dev_tools"],
  dev_tool: ["dev_tools", "startups_general", "saas"],
  saas: ["saas", "startups_general"],
  other: ["startups_general"],
};
const AVOID_CONDITIONS = ["badge", "backlink", "vote_or_review_others", "call"];
const SOCIAL_LOGIN = ["google", "github", "x"];
const STALE_DAYS = 30;
export const KIT_PRICE_USD = 29;

export function tierOf(s: KitSite): Tier {
  if (s.free === "no" || s.outcome.startsWith("blocked") || s.conditions.some((c) => AVOID_CONDITIONS.includes(c))) return "avoid";
  if (s.human.length > 0 || !["unknown", "none"].includes(s.captcha) || (s.login.length > 0 && s.login.every((l) => SOCIAL_LOGIN.includes(l)))) return "manual";
  return "auto";
}

const avoidReason = (s: KitSite): KitAvoid => ({
  domain: s.domain,
  reason: s.free === "no" ? "paid_only" : s.outcome.startsWith("blocked") ? s.outcome : "badge_or_backlink_or_votes",
  detail: s.free === "no" ? "No free submission." : s.outcome.startsWith("blocked") ? "We were blocked here (captcha or badge requirement)." : `Free tier requires: ${s.conditions.filter((c) => AVOID_CONDITIONS.includes(c)).join(", ")}.`,
});

export function recommendDirectories(
  data: KitData,
  o: { productType: ProductType; full: boolean; now: Date; languages?: string[]; openSource?: boolean },
) {
  const langs = o.languages ?? ["en"];
  const fits = FITS[o.productType] ?? FITS.other;
  const matching = data.sites.filter(
    (s) =>
      langs.includes(s.language) &&
      (s.accepts.some((a) => fits.includes(a)) || (o.openSource === true && s.accepts.includes("open_source_only"))) &&
      !s.accepts.includes("regional"),
  );
  const rank = (s: KitSite) =>
    // auto sites first (an agent can finish them alone), then closest fit, measured dofollow, a known success signal
    (tierOf(s) === "auto" ? 0 : 100) + (s.accepts.includes(fits[0]) ? 0 : 10) + (s.link === "dofollow" ? 0 : 3) + (s.success ? 0 : 1);
  const recommended = matching.filter((s) => tierOf(s) !== "avoid").sort((a, b) => rank(a) - rank(b) || a.domain.localeCompare(b.domain));
  const picked = recommended.slice(0, o.full ? 30 : 10).map((s) => ({
    domain: s.domain,
    tier: tierOf(s),
    free_conditions: s.conditions,
    queue: s.queue,
    paid_from_usd: s.paidFrom,
    link_measured: s.link,
    login: s.login,
    human_steps: s.human,
    tips: s.tips,
    success_signal: s.success,
    last_verified: s.verified,
    stale: (o.now.getTime() - Date.parse(s.verified)) / 86400_000 > STALE_DAYS,
  }));
  const checklist = new Map<string, string[]>();
  for (const p of picked) for (const h of p.human_steps) checklist.set(h, [...(checklist.get(h) ?? []), p.domain]);
  return {
    product_type: o.productType,
    matching_sites: recommended.length,
    sites: picked,
    human_checklist: [...checklist].map(([step, domains]) => ({ step, domains })),
    avoid: o.full ? [...data.avoid, ...matching.filter((s) => tierOf(s) === "avoid").map(avoidReason)] : undefined,
    upgrade: o.full ? undefined : `Showing ${picked.length} of ${Math.min(recommended.length, 30)}. The full list (30 sites plus the "don't submit" list with reasons, updated for 30 days) is a one-time $${KIT_PRICE_USD}: https://agentoolrank.com/submit-kit?type=${o.productType} (the same free 10 are shown there for a person to read).`,
    notes: [
      "Facts come from our own submissions (last_verified). Rules change; entries older than 30 days are marked stale.",
      "link_measured is only set where we checked the live rel attribute; unknown means not checked, not dofollow.",
      "Stop at human_steps and hand them to a person; do not try to bypass captchas.",
      "No traffic, ranking or dofollow is promised by any listing.",
    ],
  };
}

/** FAQ for /submit-kit (FAQPage JSON-LD). Every number comes from the dataset; no traffic or ranking claims. */
export function kitFaq(data: KitData, now: Date): { q: string; a: string }[] {
  const count = (t: ProductType) => recommendDirectories(data, { productType: t, full: true, now }).matching_sites;
  const auto = data.sites.filter((s) => tierOf(s) === "auto").length;
  return [
    {
      q: "Which directories should I submit an AI tool to?",
      a: `Start with the ones that fit your product and have a free option without a badge or backlink condition. Of the ${data.sites.length} directories in the Submit Kit, ${count("ai_tool")} fit an AI tool; the top 10 are free on this page and over MCP.`,
    },
    {
      q: "Where should I list an MCP server?",
      a: `${count("mcp_server")} directories fit an MCP server in our data. Pick "MCP server" above to see the free top 10 with each site's conditions and the steps only a person can do.`,
    },
    {
      q: "Can an AI agent submit to these directories for me?",
      a: `${auto} of the ${data.sites.length} sites are marked auto: in our runs an agent could finish them alone. The rest need one human step such as an inbox link or a captcha, and the kit lists those steps so you can do them in one sitting. It never solves captchas.`,
    },
    {
      q: "Which directories should I skip?",
      a: `The full kit has a don't-submit list of ${data.avoid.length} sites with the reason for each: paid only, a badge or backlink required, voting for others, broken forms, or new domains rejected automatically.`,
    },
    {
      q: "Does listing in these directories bring traffic or better rankings?",
      a: "We don't promise either. The kit saves time and avoids dead ends; the link type shown for each site is what we measured on a live listing, and unknown means we didn't check.",
    },
  ];
}
