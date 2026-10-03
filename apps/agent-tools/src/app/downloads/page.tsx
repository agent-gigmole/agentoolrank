import Link from "next/link";
import type { Metadata } from "next";
import { getDownloadRows } from "@repo/db/queries";
import { Breadcrumbs, BreadcrumbJsonLd } from "@repo/ui/Breadcrumbs";
import { compactCount, rankByDownloads, usedMoreThanStarred } from "@/lib/downloads";

export const revalidate = 86400; // counts refresh weekly; a daily rebuild is plenty

export const metadata: Metadata = {
  alternates: { canonical: "/downloads" },
  title: "Most-Downloaded Open-Source AI Agent Tools (npm & PyPI, Last 30 Days)",
  description:
    "Open-source AI agent frameworks, coding agents and MCP tools ranked by real package downloads on npm and PyPI in the last 30 days, with downloads per GitHub star. Updated weekly.",
};

const BASE = "https://agentoolrank.com";

export default async function DownloadsPage() {
  const ranked = rankByDownloads(await getDownloadRows());
  const top = ranked.slice(0, 100);
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Most-downloaded open-source AI agent tools (npm and PyPI, last 30 days)",
    itemListElement: top.map((t, i) => ({ "@type": "ListItem", position: i + 1, url: `${BASE}/tool/${t.id}`, name: t.name })),
  };
  const usedMore = usedMoreThanStarred(ranked, 10);
  const heavy = usedMore[0];

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <BreadcrumbJsonLd items={[{ label: "Most-downloaded tools" }]} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <Breadcrumbs items={[{ label: "Most-downloaded tools" }]} />
      <h1 className="text-3xl font-bold text-gray-900 mb-3">Most-downloaded open-source AI agent tools</h1>
      <p className="text-gray-700 mb-2">
        Stars measure attention; downloads measure use. This list ranks the {ranked.length} agent tools in our directory that publish a
        package by their npm and PyPI downloads over the last 30 days.
        {heavy && (
          <>
            {" "}The most-used per star is <Link href={`/tool/${heavy.id}`} className="text-blue-600 hover:underline">{heavy.name}</Link>, with about{" "}
            {heavy.perStar?.toLocaleString("en-US")} downloads a month for every GitHub star.
          </>
        )}
      </p>
      <p className="text-xs text-gray-500 mb-6">
        Counts come from the npm downloads API and pypistats. A package only counts if its registry page links back to the tool&apos;s own
        GitHub repo, so same-named packages from other people are left out. Downloads include CI and mirrors, so treat them as a usage
        signal, not a user count. Updated weekly.
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
            {top.map((t, i) => (
              <tr key={t.id} className="border-b border-gray-100">
                <td className="py-2 pr-3 text-gray-400">{i + 1}</td>
                <td className="py-2 pr-3"><Link href={`/tool/${t.id}`} className="font-medium text-gray-900 hover:text-blue-600">{t.name}</Link></td>
                <td className="py-2 pr-3 text-right font-semibold">{compactCount(t.total)}</td>
                <td className="py-2 pr-3 text-gray-600">
                  {t.packages.map((p, j) => (
                    <span key={p.label}>
                      {j > 0 && " · "}
                      <a href={p.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{p.label} <code className="text-xs">{p.pkg}</code></a>
                    </span>
                  ))}
                </td>
                <td className="py-2 pr-3 text-right text-gray-600">{t.perStar?.toLocaleString("en-US") ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {usedMore.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Used far more than they are starred</h2>
          <p className="text-sm text-gray-600 mb-3">
            Downloads per GitHub star, among tools with at least 100K downloads in the last 30 days. A high ratio usually means a library
            other software depends on (installed in builds and CI), not an app people star after trying it.
          </p>
          <ol className="grid md:grid-cols-2 gap-2 text-sm">
            {usedMore.map((t, i) => (
              <li key={t.id} className="flex items-baseline gap-2 p-2 border border-gray-100 rounded">
                <span className="text-gray-400 w-5">{i + 1}</span>
                <Link href={`/tool/${t.id}`} className="font-medium text-gray-900 hover:text-blue-600">{t.name}</Link>
                <span className="ml-auto text-gray-600">{t.perStar?.toLocaleString("en-US")} per star</span>
                <span className="text-gray-400">({compactCount(t.total)} / {compactCount(t.stars ?? 0)} stars)</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <p className="text-sm text-gray-600 mt-6">
        Missing a tool? Only tools that publish an npm or PyPI package from their own repo appear here. <Link href="/submit" className="text-blue-600 hover:underline">Submit an agent tool</Link>{" "}
        or see the <Link href="/weekly" className="text-blue-600 hover:underline">fastest-growing tools this week</Link>.
      </p>
    </main>
  );
}
