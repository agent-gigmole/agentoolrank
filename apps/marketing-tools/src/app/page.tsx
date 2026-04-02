import Link from "next/link";
import { getCategories, getTools, getToolCount, getLastRefreshTime } from "@repo/db/queries";
import { ToolCard } from "@/components/ToolCard";
import { NewsletterForm } from "@/components/NewsletterForm";
import type { Metadata } from "next";

export const revalidate = 43200; // 12 hours

export const metadata: Metadata = {
  alternates: {
    canonical: process.env.NEXT_PUBLIC_BASE_URL || "https://aimarketrank.com",
  },
};

export default async function HomePage() {
  const [categories, trendingTools, toolCount, lastRefresh] = await Promise.all([
    getCategories(),
    getTools({ sort: "velocity", limit: 12 }),
    getToolCount(),
    getLastRefreshTime(),
  ]);

  const refreshAgo = lastRefresh
    ? getTimeAgo(new Date(lastRefresh))
    : null;

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero — AI Search */}
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          AI Marketing Tools
        </h1>
        <p className="text-lg text-gray-600 mb-1">
          Compare 200+ AI marketing tools with real data. Find the right tools for your marketing stack.
        </p>
        {toolCount > 0 && (
          <p className="text-sm text-gray-400 mb-6">
            {toolCount} tools tracked · Updated {refreshAgo || "daily"}
          </p>
        )}

        {/* AI Search Box */}
        <div className="max-w-2xl mx-auto">
          <form action="/search" method="GET">
            <div className="relative">
              <input
                type="text"
                name="q"
                placeholder="e.g. Content marketing automation / AI SEO tools / Email + CRM setup..."
                className="w-full px-5 py-4 pr-20 border border-gray-300 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Ask AI
              </button>
            </div>
          </form>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {["AI SEO tools", "Email automation", "Content marketing", "Social media AI", "Marketing analytics"].map((q) => (
              <a
                key={q}
                href={`/search?q=${encodeURIComponent(q)}`}
                className="text-xs px-3 py-1 border border-gray-200 rounded-full hover:border-blue-300 hover:bg-blue-50/50 text-gray-500 hover:text-blue-600 transition-colors"
              >
                {q}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Browse by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all"
            >
              <span className="text-xl">{cat.icon}</span>
              <div>
                <div className="font-medium text-sm text-gray-900">{cat.name}</div>
                {cat.tool_count > 0 && (
                  <div className="text-xs text-gray-400">{cat.tool_count} tools</div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending Tools */}
      {trendingTools.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Trending</h2>
            <span className="text-xs text-gray-400">Ranked by star growth</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {trendingTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      )}

      {/* Newsletter CTA */}
      <NewsletterForm />
    </main>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
