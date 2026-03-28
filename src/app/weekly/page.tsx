import Link from "next/link";
import { getTrendingTools, getNewTools, getToolCount } from "@/lib/queries";
import { Breadcrumbs, BreadcrumbJsonLd } from "@/components/Breadcrumbs";
import { NewsletterForm } from "@/components/NewsletterForm";
import type { Metadata } from "next";

export const revalidate = 43200; // 12h

function getWeekLabel(): string {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay()); // Sunday
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}, ${now.getFullYear()}`;
}

export const metadata: Metadata = {
  title: "AI Agent Weekly — Top Trending Tools This Week",
  description:
    "Weekly digest of the fastest-growing AI agent tools. See what's trending in agent frameworks, coding assistants, RAG, and more.",
};

function formatStars(n: number | null): string {
  if (n === null) return "—";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default async function WeeklyPage() {
  const [trending, newTools, toolCount] = await Promise.all([
    getTrendingTools(15),
    getNewTools(7, 10),
    getToolCount(),
  ]);

  const weekLabel = getWeekLabel();

  return (
    <>
      <BreadcrumbJsonLd items={[{ label: "AI Agent Weekly" }]} />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: "AI Agent Weekly" }]} />

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI Agent Weekly
          </h1>
          <p className="text-gray-500 text-sm">{weekLabel}</p>
          <p className="text-gray-600 mt-2">
            The fastest-growing AI agent tools this week, tracked across {toolCount} projects.
          </p>
        </div>

        {/* Trending Section */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            Trending This Week
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Ranked by star velocity (stars gained per month)
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="py-2 pr-3 text-gray-500 font-normal w-8">#</th>
                  <th className="py-2 pr-3 text-gray-500 font-normal">Tool</th>
                  <th className="py-2 pr-3 text-gray-500 font-normal text-right">Stars</th>
                  <th className="py-2 pr-3 text-gray-500 font-normal text-right">Velocity</th>
                  <th className="py-2 text-gray-500 font-normal">Category</th>
                </tr>
              </thead>
              <tbody>
                {trending.map((tool, i) => (
                  <tr key={tool.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2.5 pr-3 text-gray-400">{i + 1}</td>
                    <td className="py-2.5 pr-3">
                      <Link href={`/tool/${tool.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                        {tool.name}
                      </Link>
                      <span className="block text-xs text-gray-500 truncate max-w-xs">
                        {tool.tagline}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-right text-gray-700 tabular-nums">
                      {formatStars(tool.github_stars)}
                    </td>
                    <td className="py-2.5 pr-3 text-right text-green-600 font-medium tabular-nums">
                      +{formatStars(tool.star_velocity_30d)}/mo
                    </td>
                    <td className="py-2.5 text-xs text-gray-500">
                      {tool.category_tags[0]?.replace(/-/g, " ") ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* New Tools This Week */}
        {newTools.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              New This Week
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Recently added to the directory
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {newTools.map((tool) => (
                <Link
                  key={tool.id}
                  href={`/tool/${tool.id}`}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-400 transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-400 shrink-0">
                    {tool.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">{tool.name}</div>
                    <div className="text-xs text-gray-500 truncate">{tool.tagline}</div>
                  </div>
                  {tool.github_stars !== null && (
                    <span className="ml-auto text-xs text-gray-400 shrink-0">
                      {formatStars(tool.github_stars)}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Subscribe CTA */}
        <NewsletterForm />
      </main>
    </>
  );
}
