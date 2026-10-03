import type { ProductType } from "./directory-kit";

// Indexable per-type landing pages for "where to submit a/an <type>" searches. Each one shows that type's free top 10
// from the tested-directories dataset and leads to the Submit Kit; copy is generated from the counts, never hand-typed lists.
export const WHERE_TYPES: { slug: string; type: ProductType; noun: string; Noun: string }[] = [
  { slug: "ai-tool", type: "ai_tool", noun: "an AI tool", Noun: "an AI Tool" },
  { slug: "mcp-server", type: "mcp_server", noun: "an MCP server", Noun: "an MCP Server" },
  { slug: "dev-tool", type: "dev_tool", noun: "a developer tool", Noun: "a Developer Tool" },
  { slug: "saas", type: "saas", noun: "a SaaS", Noun: "a SaaS" },
];

export function whereCopy(slug: string, o: { tested: number; fits: number; year: number }) {
  const t = WHERE_TYPES.find((w) => w.slug === slug);
  if (!t) return null;
  return {
    ...t,
    title: `Where to Submit ${t.Noun}: ${o.fits} Directories That Fit (${o.year})`,
    h1: `Where to submit ${t.noun}`,
    description: `${o.fits} launch directories that fit ${t.noun}, out of ${o.tested} we tested with our own products: free tier, link type, login, form steps.`,
  };
}

/** FAQ for one type's page (FAQPage JSON-LD). Every number is counted from the recommended (non-avoid) sites for that type. */
export function whereFaq(noun: string, sites: Array<{ free: string; conditions: string[]; human: string[]; link: string }>): { q: string; a: string }[] {
  const n = sites.length;
  const freeClean = sites.filter((s) => s.free === "yes" && s.conditions.length === 0).length;
  const noHuman = sites.filter((s) => s.human.length === 0).length;
  const dofollow = sites.filter((s) => s.link === "dofollow").length;
  const checked = sites.filter((s) => s.link !== "unknown").length;
  return [
    {
      q: `How many directories accept ${noun}?`,
      a: `${n} of the directories we tested accept ${noun} and are worth submitting to. ${freeClean} of them have a free listing with no badge, backlink, post or queue condition.`,
    },
    {
      q: `Can an AI agent submit ${noun} to these directories?`,
      a: `On ${noHuman} of the ${n} an agent could finish the form alone in our runs. The rest need one human step such as an inbox link, a captcha or a real name; the Submit Kit lists those steps so you can do them in one sitting.`,
    },
    {
      q: "Do these directories give dofollow backlinks?",
      a: `We checked the live link on ${checked} of the ${n}; ${dofollow} were dofollow. Where we did not check, the list says unknown rather than guessing. No listing promises traffic or rankings.`,
    },
  ];
}
