import type { Metadata } from "next";
import Link from "next/link";
import { KIT_PRICE_USD, kitFaq, recommendDirectories, type KitData, type ProductType } from "@/lib/directory-kit";
import { FaqSection } from "@/components/FaqSection";
import { db } from "@repo/db";
import { ourResultLabel } from "@/lib/listing-check";
import kitData from "@/lib/directory-kit-data.json";
import { KitBuyButton } from "@/components/KitBuyButton";

export const metadata: Metadata = {
  title: "Best Directories to Submit an AI Tool or MCP Server (Tested) — Submit Kit",
  description: `Which directories to submit an AI tool, MCP server, dev tool or SaaS to, and which to skip. Ranked from our own submissions: free-tier conditions, measured link type, form tips, human-only steps. Free top 10; full list $${KIT_PRICE_USD} one-time.`,
  alternates: { canonical: "/submit-kit" },
};

const TYPES: { id: ProductType; label: string }[] = [
  { id: "ai_tool", label: "AI tool" },
  { id: "mcp_server", label: "MCP server" },
  { id: "dev_tool", label: "Developer tool" },
  { id: "saas", label: "SaaS" },
];

export default async function SubmitKitPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const productType = (TYPES.find((t) => t.id === type)?.id ?? "ai_tool") as ProductType;
  // The same free top 10 an agent gets from recommend_directories without a key, shown to people too.
  const free = recommendDirectories(kitData as KitData, { productType, full: false, now: new Date() });
  // Proof from our own listings (scripts/check-listings.ts → listing_checks): where our own page actually went live.
  const ours: Record<string, string> = await db
    .execute("SELECT domain, state, rel, target FROM listing_checks WHERE state = 'live'")
    .then((r) => Object.fromEntries(r.rows.map((x) => [String(x.domain), ourResultLabel({ state: "live", rel: x.rel === null ? null : String(x.rel), target: x.target === null ? null : String(x.target) })])), () => ({}));
  return (
    <main className="max-w-2xl mx-auto px-4 py-10 text-gray-800">
      <h1 className="text-3xl font-bold text-gray-900 mb-3">Submit Kit: submit to fewer directories, the right ones</h1>
      <p className="mb-4">
        A tool for your own agent. Call <code>recommend_directories</code> on our MCP server with your product type and it returns launch
        directories our own products actually went through: each one tagged <b>auto</b> (your agent can finish it) or <b>manual</b> (needs
        one human step), with the free-tier conditions, the link type we measured on a live listing, login method, form tips and the
        confirmation to look for. All human-only steps (inbox links, captchas, real names) come back as one checklist, so you do them in one sitting.
      </p>
      <ul className="list-disc pl-5 space-y-1 mb-6 text-sm">
        <li><b>Free:</b> the top 10 for your product type, right now, no signup.</li>
        <li><b>Full, ${KIT_PRICE_USD} one-time:</b> 30 sites plus the &ldquo;don&rsquo;t submit&rdquo; list with reasons (paid-only, badge-for-link, vote-for-others, broken forms, auto-reject of new domains), updated for 30 days. You get a key right after payment.</li>
        <li><b>Not included:</b> automated submission, captcha solving, or any promise of traffic, rankings or dofollow links.</li>
      </ul>
      {process.env.STRIPE_SECRET_KEY && <KitBuyButton price={KIT_PRICE_USD} />}
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Free top 10, right here</h2>
      <div className="flex flex-wrap gap-2 mb-3 text-sm">
        {TYPES.map((t) => (
          <Link key={t.id} href={`/submit-kit?type=${t.id}`} data-testid={`kit-type-${t.id}`}
            className={`px-3 py-1 rounded-full border ${t.id === productType ? "bg-gray-900 text-white border-gray-900" : "border-gray-300 hover:border-gray-500"}`}>
            {t.label}
          </Link>
        ))}
      </div>
      <ol className="space-y-2 mb-3 text-sm">
        {free.sites.map((d, i) => (
          <li key={d.domain} className="border border-gray-200 rounded-lg p-3">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-gray-400">{i + 1}.</span>
              <b>{d.domain}</b>
              <span className={`text-xs px-2 py-0.5 rounded-full ${d.tier === "auto" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>{d.tier === "auto" ? "your agent can finish it" : "needs one human step"}</span>
              {ours[d.domain] && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800" data-testid="kit-our-result">our own listing: {ours[d.domain].replace(/^Live · /, "live, ").replace(/^Live$/, "live")}</span>}
              <span className="ml-auto text-xs text-gray-500">link measured: {d.link_measured} · verified {d.last_verified}</span>
            </div>
            {d.human_steps.length > 0 && <div className="text-xs text-gray-600 mt-1">Human steps: {d.human_steps.join(", ").replace(/_/g, " ")}</div>}
            {d.tips[0] && <div className="text-xs text-gray-600 mt-1">Tip: {d.tips[0]}</div>}
          </li>
        ))}
      </ol>
      <p className="text-sm text-gray-600 mb-6">
        {free.matching_sites} directories fit this product type. The full list adds the next 20 and the &ldquo;don&rsquo;t submit&rdquo; list with reasons, for ${KIT_PRICE_USD} one-time.
      </p>
      {process.env.STRIPE_SECRET_KEY && <KitBuyButton price={KIT_PRICE_USD} />}
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Use it</h2>
      <pre className="bg-gray-50 border rounded-lg p-3 text-xs overflow-x-auto mb-4">{`{ "mcpServers": { "agentoolrank": { "url": "https://agentoolrank.com/api/mcp" } } }

recommend_directories({ "product_type": "ai_tool" })   // ai_tool | mcp_server | dev_tool | saas | other`}</pre>
      <p className="text-sm text-gray-600 mb-4">Optional: a <Link href="/api-key" className="underline">free API key</Link> (one click, no signup) identifies your agent; the free top 10 works without it.</p>
      <p className="text-sm text-gray-600">
        The free comparison table is at <Link href="/where-to-list" className="underline">/where-to-list</Link>. Facts come from our own
        submissions and carry a last-verified date; entries older than 30 days are marked stale. Questions: hello@agentoolrank.com.
      </p>
      <FaqSection faq={kitFaq(kitData as KitData, new Date())} />
    </main>
  );
}
