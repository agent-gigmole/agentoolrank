import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@repo/db";
import { KIT_PRICE_USD, recommendDirectories, type KitData } from "@/lib/directory-kit";
import { ourResultLabel } from "@/lib/listing-check";
import { WHERE_TYPES, whereCopy } from "@/lib/where-to-submit";
import kitData from "@/lib/directory-kit-data.json";
import { KitBuyButton } from "@/components/KitBuyButton";
import { Breadcrumbs, BreadcrumbJsonLd } from "@repo/ui/Breadcrumbs";

// Indexable "where to submit <type>" pages: the free top 10 from our tested-directories dataset for one product type.
export const revalidate = 86400;
export const generateStaticParams = () => WHERE_TYPES.map((w) => ({ slug: w.slug }));

type Props = { params: Promise<{ slug: string }> };
const data = kitData as KitData;

function copyFor(slug: string) {
  const t = WHERE_TYPES.find((w) => w.slug === slug);
  if (!t) return null;
  const free = recommendDirectories(data, { productType: t.type, full: false, now: new Date() });
  const c = whereCopy(slug, { tested: data.sites.length, fits: free.matching_sites, year: new Date().getFullYear() });
  return c && { c, free };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const x = copyFor((await params).slug);
  if (!x) return {};
  return { title: x.c.title, description: x.c.description, alternates: { canonical: `/where-to-submit/${x.c.slug}` } };
}

export default async function WhereToSubmitPage({ params }: Props) {
  const x = copyFor((await params).slug);
  if (!x) notFound();
  const { c, free } = x;
  const base = process.env.NEXT_PUBLIC_BASE_URL || "https://agentoolrank.com";
  const ours: Record<string, string> = await db
    .execute("SELECT domain, state, rel, target FROM listing_checks WHERE state = 'live'")
    .then((r) => Object.fromEntries(r.rows.map((d) => [String(d.domain), ourResultLabel({ state: "live", rel: d.rel === null ? null : String(d.rel), target: d.target === null ? null : String(d.target) })])), () => ({}));
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: c.h1,
    url: `${base}/where-to-submit/${c.slug}`,
    numberOfItems: free.sites.length,
    itemListElement: free.sites.map((d, i) => ({ "@type": "ListItem", position: i + 1, name: d.domain, url: `https://${d.domain}` })),
  };
  const crumbs = [{ label: "Submit Kit", href: "/submit-kit" }, { label: c.h1 }];
  return (
    <main className="max-w-2xl mx-auto px-4 py-10 text-gray-800">
      <BreadcrumbJsonLd items={crumbs} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <Breadcrumbs items={crumbs} />
      <h1 className="text-3xl font-bold text-gray-900 mb-3">{c.h1}</h1>
      <p className="mb-4">
        We submitted our own products to {data.sites.length} launch directories and recorded what each one asks for. {free.matching_sites} of them
        accept {c.noun}. These are the first 10, ordered by how much they are worth your time: a free option without a badge or backlink
        condition first, then the link type we measured on a live listing.
      </p>
      <ol className="space-y-2 mb-4 text-sm">
        {free.sites.map((d, i) => (
          <li key={d.domain} className="border border-gray-200 rounded-lg p-3">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-gray-400">{i + 1}.</span>
              <b>{d.domain}</b>
              <span className={`text-xs px-2 py-0.5 rounded-full ${d.tier === "auto" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>{d.tier === "auto" ? "an agent can finish it" : "needs one human step"}</span>
              {ours[d.domain] && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">our own listing: {ours[d.domain].replace(/^Live · /, "live, ").replace(/^Live$/, "live")}</span>}
              <span className="ml-auto text-xs text-gray-500">link measured: {d.link_measured} · verified {d.last_verified}</span>
            </div>
            {d.human_steps.length > 0 && <div className="text-xs text-gray-600 mt-1">Human steps: {d.human_steps.join(", ").replace(/_/g, " ")}</div>}
            {d.tips[0] && <div className="text-xs text-gray-600 mt-1">Tip: {d.tips[0]}</div>}
          </li>
        ))}
      </ol>
      <p className="text-sm text-gray-600 mb-4">
        The full Submit Kit adds the next 20 for {c.noun} and the &ldquo;don&rsquo;t submit&rdquo; list with reasons (paid-only, badge-for-link,
        broken forms, auto-reject of new domains), ${KIT_PRICE_USD} one-time. Your agent can also get this list over MCP with{" "}
        <code>recommend_directories</code>.
      </p>
      {process.env.STRIPE_SECRET_KEY && <KitBuyButton price={KIT_PRICE_USD} />}
      <p className="text-sm text-gray-600 mb-2">Other product types:</p>
      <ul className="flex flex-wrap gap-2 text-sm mb-6">
        {WHERE_TYPES.filter((w) => w.slug !== c.slug).map((w) => (
          <li key={w.slug}><Link href={`/where-to-submit/${w.slug}`} className="text-blue-600 hover:underline">Where to submit {w.noun}</Link></li>
        ))}
      </ul>
      <p className="text-sm text-gray-600">
        Listing an open-source AI agent tool? <Link href="/submit" className="underline">Submit it to AgentoolRank</Link> for free. The comparison
        table of every directory we tested is at <Link href="/where-to-list" className="underline">/where-to-list</Link>.
      </p>
    </main>
  );
}
