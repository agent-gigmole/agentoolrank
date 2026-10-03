import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCategories, getDownloadRows } from "@repo/db/queries";
import { Breadcrumbs, BreadcrumbJsonLd } from "@repo/ui/Breadcrumbs";
import { compactCount, DOWNLOAD_CATEGORY_MIN, downloadCategorySlugs, rankByDownloads } from "@/lib/downloads";
import { compareSlug } from "@/lib/alternatives";

export const revalidate = 86400;
const BASE = "https://agentoolrank.com";

async function load(slug: string) {
  const cat = (await getCategories()).find((c) => c.slug === slug);
  if (!cat) return null;
  const ranked = rankByDownloads(await getDownloadRows(), slug);
  return ranked.length >= DOWNLOAD_CATEGORY_MIN ? { cat, ranked } : null;
}

export async function generateStaticParams() {
  const rows = await getDownloadRows();
  const cats = await getCategories();
  return [...downloadCategorySlugs(rows, cats.map((c) => c.slug)).keys()].map((category) => ({ category }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const d = await load(category);
  if (!d) return {};
  const top = d.ranked.slice(0, 3).map((t) => t.name).join(", ");
  return {
    title: `Most-Downloaded ${d.cat.name} (npm & PyPI, Last 30 Days)`,
    description: `${d.ranked.length} open-source ${d.cat.name.toLowerCase()} ranked by real npm and PyPI downloads in the last 30 days. Top: ${top}. Updated weekly.`,
    alternates: { canonical: `/downloads/${category}` },
  };
}

export default async function DownloadsCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const d = await load(category);
  if (!d) notFound();
  const { cat, ranked } = d;
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Most-downloaded ${cat.name} (npm and PyPI, last 30 days)`,
    itemListElement: ranked.map((t, i) => ({ "@type": "ListItem", position: i + 1, url: `${BASE}/tool/${t.id}`, name: t.name })),
  };
  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <BreadcrumbJsonLd items={[{ label: "Most-downloaded tools", href: "/downloads" }, { label: cat.name }]} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <Breadcrumbs items={[{ label: "Most-downloaded tools", href: "/downloads" }, { label: cat.name }]} />
      <h1 className="text-3xl font-bold text-gray-900 mb-3">Most-downloaded {cat.name}</h1>
      <p className="text-gray-700 mb-2">
        {ranked.length} tools in <Link href={`/category/${cat.slug}`} className="text-blue-600 hover:underline">{cat.name}</Link> publish an npm or
        PyPI package from their own repo. Here they are by downloads over the last 30 days. {ranked[0].name} leads with {compactCount(ranked[0].total)}.
      </p>
      <p className="text-xs text-gray-500 mb-6">
        Counts from the npm downloads API and pypistats; a package only counts if its registry page links back to the tool&apos;s repo. Downloads
        include CI and mirrors, so read them as a usage signal, not a user count. Updated weekly.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2 pr-3">#</th>
              <th className="py-2 pr-3">Tool</th>
              <th className="py-2 pr-3 text-right">Downloads (30 days)</th>
              <th className="py-2 pr-3">Packages</th>
              <th className="py-2 pr-3 text-right">Per GitHub star</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((t, i) => (
              <tr key={t.id} className="border-b border-gray-100">
                <td className="py-2 pr-3 text-gray-400">{i + 1}</td>
                <td className="py-2 pr-3"><Link href={`/tool/${t.id}`} className="font-medium text-gray-900 hover:text-blue-600">{t.name}</Link></td>
                <td className="py-2 pr-3 text-right font-semibold">{compactCount(t.total)}</td>
                <td className="py-2 pr-3 text-gray-600">
                  {t.packages.map((p, j) => (
                    <span key={p.label}>{j > 0 && " · "}<a href={p.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{p.label} <code className="text-xs">{p.pkg}</code></a></span>
                  ))}
                </td>
                <td className="py-2 pr-3 text-right text-gray-600">{t.perStar?.toLocaleString("en-US") ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {ranked.length >= 2 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Compare the most-downloaded {cat.name}</h2>
          <p className="text-sm flex flex-wrap gap-x-3 gap-y-1">
            {ranked.slice(0, 6).flatMap((a, i, top) => top.slice(i + 1).map((b) => (
              <Link key={`${a.id}-${b.id}`} href={`/compare/${compareSlug(a.id, b.id)}`} className="text-blue-600 hover:underline">{a.name} vs {b.name}</Link>
            )))}
          </p>
        </section>
      )}

      <p className="text-sm text-gray-600 mt-6">
        <Link href="/downloads" className="text-blue-600 hover:underline">All agent tools by downloads</Link> ·{" "}
        <Link href={`/category/${cat.slug}`} className="text-blue-600 hover:underline">{cat.name} ranked by GitHub activity</Link>
      </p>
    </main>
  );
}
