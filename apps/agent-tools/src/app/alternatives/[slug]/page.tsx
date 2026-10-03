import { notFound } from "next/navigation";
import Link from "next/link";
import { getToolBySlug, getToolPackages } from "@repo/db/queries";
import { compactCount, totalDownloads, usageVerdict } from "@/lib/downloads";
import { softwareAppJsonLd } from "@/lib/compare-jsonld";
import { Breadcrumbs, BreadcrumbJsonLd } from "@repo/ui/Breadcrumbs";
import type { Metadata } from "next";
import type { Tool } from "@repo/db/schema";

const signed = (v: number) => {
  const r = Math.round(v);
  return r > 0 ? `+${r.toLocaleString("en-US")}` : r < 0 ? r.toLocaleString("en-US") : "0";
};
import { alternativesTitle, compareSlug, taglineMentionsName } from "@/lib/alternatives";
import { alternativesFaq } from "@/lib/faq";
import { alternativesVerdict, alternativesDescription } from "@/lib/verdict";
import { FaqSection } from "@/components/FaqSection";

export const revalidate = 86400; // 24h

type Props = { params: Promise<{ slug: string }> };

interface Intel {
  key_differentiator?: string;
  best_for?: string[];
  not_for?: string[];
  deployment?: string[];
}

function parseIntel(raw: string): Intel {
  try {
    const parsed = JSON.parse(raw || "{}");
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function formatStars(n: number | null): string {
  if (n === null) return "—";
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function formatDate(d: string | null): string {
  return d ? d.slice(0, 10) : "—";
}

async function load(slug: string): Promise<{ tool: Tool; alts: Tool[] } | null> {
  const tool = await getToolBySlug(slug);
  if (!tool || tool.alternatives.length === 0) return null;
  const alts = (await Promise.all(tool.alternatives.map((id) => getToolBySlug(id)))).filter((t): t is Tool => t !== null);
  return alts.length > 0 ? { tool, alts } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) return {};
  const { tool, alts } = data;
  const year = new Date().getFullYear();
  return {
    title: alternativesTitle(tool.name, alts.length, year),
    description: alternativesDescription(tool, alts),
    alternates: { canonical: `/alternatives/${tool.id}` },
  };
}

function ItemListJsonLd({ tool, alts, dl }: { tool: Tool; alts: Tool[]; dl?: Map<string, number | null> }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://agentoolrank.com";
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${tool.name} alternatives`,
    itemListElement: alts.map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: softwareAppJsonLd(a, dl?.get(a.id) ?? null, baseUrl), // with 30-day downloads where we have a count
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default async function AlternativesPage({ params }: Props) {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) notFound();
  const { tool, alts } = data;
  const verdict = alternativesVerdict(tool, alts, new Date());
  const dl = new Map(await Promise.all([tool, ...alts].map(async (t) => [t.id, totalDownloads(await getToolPackages(t.id))] as const)));
  const showDl = [...dl.values()].some((v) => v !== null);
  const usage = usageVerdict([tool, ...alts].map((t) => ({ name: t.name, stars: t.github_stars, downloads: dl.get(t.id) ?? null })));
  const intel = parseIntel(tool.intelligence);
  const year = new Date().getFullYear();
  const crumbs = [
    { label: tool.name, href: `/tool/${tool.id}` },
    { label: "Alternatives" },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={crumbs} />
      <ItemListJsonLd tool={tool} alts={alts} dl={dl} />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Breadcrumbs items={crumbs} />
        <h1 className="text-3xl font-bold text-gray-900 mb-3">{alternativesTitle(tool.name, alts.length, year)}</h1>
        <p className="text-gray-600 mb-2">
          {taglineMentionsName(tool.name, tool.tagline) ? (
            <>{tool.tagline.replace(/\.?$/, ".")}</>
          ) : (
            <>
              <Link href={`/tool/${tool.id}`} className="font-medium text-gray-900 hover:underline">{tool.name}</Link>
              {tool.tagline ? ` — ${tool.tagline.replace(/\.?$/, ".")}` : "."}
            </>
          )}
          {intel.key_differentiator ? ` ${intel.key_differentiator}` : ""}
        </p>
        {verdict.length > 0 && (
          <section className="mb-6 border border-blue-100 bg-blue-50/50 rounded-lg p-4">
            <h2 className="text-base font-semibold text-gray-900 mb-2">Short answer</h2>
            <ul className="space-y-1.5 text-sm text-gray-700 list-disc pl-5">
              {verdict.map((v) => <li key={v}>{v}</li>)}
            </ul>
          </section>
        )}
        <p className="text-gray-600 mb-8">
          These {alts.length} open-source tools do the same job. They are ordered by how closely they match {tool.name},
          with live GitHub data so you can see which projects are actively maintained.
        </p>

        {usage && <p className="text-sm text-gray-700 mb-2">{usage} <Link href="/downloads" className="text-blue-600 hover:underline">See all agent tools by downloads</Link>.</p>}
        <div className="overflow-x-auto mb-10 border border-gray-200 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left py-2 px-3">Tool</th>
                <th className="text-right py-2 px-3">GitHub stars</th>
                <th className="text-right py-2 px-3">Stars / 30d</th>
                <th className="text-right py-2 px-3">Last commit</th>
                {showDl && <th className="text-right py-2 px-3">Downloads / 30d</th>}
              </tr>
            </thead>
            <tbody>
              {[tool, ...alts].map((t) => (
                <tr key={t.id} className={`border-t border-gray-100 ${t.id === tool.id ? "bg-blue-50" : ""}`}>
                  <td className="py-2 px-3">
                    <Link href={`/tool/${t.id}`} className="font-medium hover:underline">{t.name}</Link>
                    {t.id === tool.id && <span className="ml-2 text-xs text-gray-500">(original)</span>}
                  </td>
                  <td className="py-2 px-3 text-right">{formatStars(t.github_stars)}</td>
                  <td className="py-2 px-3 text-right">{t.star_velocity_30d != null ? signed(t.star_velocity_30d) : "—"}</td>
                  <td className="py-2 px-3 text-right">{formatDate(t.last_commit_date)}</td>
                  {showDl && <td className="py-2 px-3 text-right">{dl.get(t.id) != null ? compactCount(dl.get(t.id) as number) : "—"}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ol className="space-y-6">
          {alts.map((alt, i) => {
            const altIntel = parseIntel(alt.intelligence);
            return (
              <li key={alt.id} className="border border-gray-200 rounded-lg p-5">
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  {i + 1}. <Link href={`/tool/${alt.id}`} className="hover:underline">{alt.name}</Link>
                </h2>
                {alt.tagline && <p className="text-gray-600 mb-3">{alt.tagline}</p>}
                {altIntel.key_differentiator && (
                  <p className="text-sm text-gray-700 mb-3">
                    <span className="font-medium">What sets it apart:</span> {altIntel.key_differentiator}
                  </p>
                )}
                {altIntel.best_for && altIntel.best_for.length > 0 && (
                  <p className="text-sm text-gray-700 mb-3">
                    <span className="font-medium">Best for:</span> {altIntel.best_for.slice(0, 3).join("; ")}
                  </p>
                )}
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="text-gray-500">⭐ {formatStars(alt.github_stars)}</span>
                  <Link href={`/compare/${compareSlug(tool.id, alt.id)}`} className="text-blue-600 hover:underline">
                    {tool.name} vs {alt.name} →
                  </Link>
                  <Link href={`/tool/${alt.id}`} className="text-blue-600 hover:underline">Full profile →</Link>
                </div>
              </li>
            );
          })}
        </ol>
        <FaqSection faq={alternativesFaq(tool, alts)} />

        <section className="mt-10 border border-gray-200 rounded-xl p-5 bg-gray-50">
          <h2 className="font-semibold text-gray-900 mb-1">Maintain {tool.name} or one of these alternatives?</h2>
          <p className="text-sm text-gray-600 mb-2">
            Each tool page has a maintainer box: a README badge with your live rank and stars, or a homepage + category feature for $49 / 7 days.
          </p>
          <p className="text-sm">
            {[tool, ...alts].slice(0, 6).map((t, i) => (
              <span key={t.id}>
                {i > 0 && " · "}
                <Link href={`/tool/${t.id}#maintainers`} data-testid="alternatives-maintainer-cta" className="text-blue-600 hover:underline">{t.name}</Link>
              </span>
            ))}
          </p>
        </section>
      </main>
    </>
  );
}
