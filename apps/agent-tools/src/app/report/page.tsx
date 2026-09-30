import type { Metadata } from "next";
import Link from "next/link";
import { getTools, getCategories, getLastRefreshTime } from "@repo/db/queries";
import { buildReport } from "@/lib/report";

export const revalidate = 86400;

const monthLabel = () => new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `State of Open-Source AI Agent Tools — ${monthLabel()} (Data Report)`,
    description:
      "Which open-source AI agent tools are growing fastest, which are still maintained, and how many popular ones went quiet. Live GitHub data, 600+ tools.",
    alternates: { canonical: "/report" },
  };
}

const n = (x: number) => x.toLocaleString("en-US");
const k = (x: number | null) => (x == null ? "—" : x >= 1000 ? `${(x / 1000).toFixed(1)}k` : String(x));

export default async function ReportPage() {
  const [tools, categories, refreshed] = await Promise.all([getTools({ limit: 2000 }), getCategories(), getLastRefreshTime()]);
  const r = buildReport(tools, new Date());
  const catName = new Map(categories.map((c) => [c.slug, c.name]));
  const top = r.fastestGrowing[0];
  const popularInactive = r.inactive.filter((t) => (t.github_stars ?? 0) >= 5000);
  const hottestCat = r.categories[0];
  const citation = `AgentoolRank, "State of Open-Source AI Agent Tools — ${monthLabel()}", https://agentoolrank.com/report`;

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Dataset",
            name: `State of Open-Source AI Agent Tools — ${monthLabel()}`,
            description: `GitHub activity metrics for ${r.toolCount} open-source AI agent tools.`,
            url: "https://agentoolrank.com/report",
            creator: { "@type": "Organization", name: "AgentoolRank", url: "https://agentoolrank.com" },
            dateModified: refreshed ?? undefined,
            license: "https://creativecommons.org/licenses/by/4.0/",
          }),
        }}
      />
      <h1 className="text-3xl font-bold text-gray-900 mb-2">State of Open-Source AI Agent Tools — {monthLabel()}</h1>
      <p className="text-gray-500 text-sm mb-8">
        Computed from live GitHub data for {n(r.toolCount)} tools tracked by AgentoolRank{refreshed ? `, last refreshed ${refreshed.slice(0, 10)}` : ""}. Updated daily.
      </p>

      <section className="grid sm:grid-cols-3 gap-4 mb-10">
        <div className="border rounded-lg p-4"><div className="text-2xl font-bold">{n(r.toolCount)}</div><div className="text-sm text-gray-500">open-source agent tools tracked</div></div>
        <div className="border rounded-lg p-4"><div className="text-2xl font-bold">{(r.totalStars / 1e6).toFixed(1)}M</div><div className="text-sm text-gray-500">GitHub stars combined</div></div>
        <div className="border rounded-lg p-4"><div className="text-2xl font-bold">{Math.round(r.inactiveShare * 100)}%</div><div className="text-sm text-gray-500">had no commit in 6+ months</div></div>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Key findings</h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-700">
          {top && <li><b>{top.name}</b> is the fastest-growing tool right now, adding about {n(Math.round(top.star_velocity_30d ?? 0))} stars per 30 days.</li>}
          {hottestCat && <li><b>{catName.get(hottestCat.slug) ?? hottestCat.slug}</b> is the fastest-growing category, with about {n(hottestCat.growth30d)} new stars per 30 days across {hottestCat.tools} tools.</li>}
          <li>{Math.round(r.inactiveShare * 100)}% of tracked tools have had no commit in six months or more{popularInactive.length ? `, including ${popularInactive.length} projects with 5,000+ stars` : ""}. Stars alone are a poor signal of whether a tool is still maintained.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Fastest-growing tools (stars per 30 days)</h2>
        <table className="w-full text-sm border rounded-lg overflow-hidden">
          <thead className="bg-gray-50 text-gray-500"><tr><th className="text-left p-2">#</th><th className="text-left p-2">Tool</th><th className="text-right p-2">Stars</th><th className="text-right p-2">+30d</th></tr></thead>
          <tbody>
            {r.fastestGrowing.map((t, i) => (
              <tr key={t.id} className="border-t"><td className="p-2">{i + 1}</td><td className="p-2"><Link className="hover:underline" href={`/tool/${t.id}`}>{t.name}</Link></td><td className="p-2 text-right">{k(t.github_stars)}</td><td className="p-2 text-right">+{n(Math.round(t.star_velocity_30d ?? 0))}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Most actively developed (commits in the last 90 days)</h2>
        <ol className="list-decimal pl-5 space-y-1 text-gray-700">
          {r.mostActive.map((t) => <li key={t.id}><Link className="hover:underline" href={`/tool/${t.id}`}>{t.name}</Link> — {n(t.commit_count_90d ?? 0)} commits</li>)}
        </ol>
      </section>

      {popularInactive.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">Popular but quiet (5,000+ stars, no commit in 6+ months)</h2>
          <ul className="list-disc pl-5 space-y-1 text-gray-700">
            {popularInactive.slice(0, 15).map((t) => <li key={t.id}><Link className="hover:underline" href={`/alternatives/${t.id}`}>{t.name}</Link> — {k(t.github_stars)} stars, last commit {t.last_commit_date?.slice(0, 10)} (see alternatives)</li>)}
          </ul>
        </section>
      )}

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Categories by growth</h2>
        <table className="w-full text-sm border rounded-lg overflow-hidden">
          <thead className="bg-gray-50 text-gray-500"><tr><th className="text-left p-2">Category</th><th className="text-right p-2">Tools</th><th className="text-right p-2">Stars</th><th className="text-right p-2">+30d</th></tr></thead>
          <tbody>
            {r.categories.map((c) => (
              <tr key={c.slug} className="border-t"><td className="p-2"><Link className="hover:underline" href={`/category/${c.slug}`}>{catName.get(c.slug) ?? c.slug}</Link></td><td className="p-2 text-right">{c.tools}</td><td className="p-2 text-right">{k(c.stars)}</td><td className="p-2 text-right">+{n(c.growth30d)}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="text-sm text-gray-600 space-y-2">
        <h2 className="text-base font-semibold text-gray-900">Methodology</h2>
        <p>Tools are open-source repositories for building, running or evaluating AI agents, screened for relevance. Stars, commits and releases come from the GitHub API and are refreshed daily. &ldquo;+30d&rdquo; is the star pace over our snapshot history, scaled to 30 days. &ldquo;Inactive&rdquo; means no commit on the default branch for 180+ days.</p>
        <p>Free to cite (CC BY 4.0): <code className="bg-gray-100 px-1">{citation}</code></p>
      </section>
    </main>
  );
}
