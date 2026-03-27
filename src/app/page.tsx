import Link from "next/link";
import { getCategories, getTools, getToolCount, getLastRefreshTime } from "@/lib/queries";
import { ToolCard } from "@/components/ToolCard";

export const revalidate = 43200; // 12 hours

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
      {/* Hero + Value Prop */}
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          AI Agent Tools Directory
        </h1>
        <p className="text-lg text-gray-600 mb-2">
          Find the right AI agent tools for your stack. Data-driven, updated daily.
        </p>
        {toolCount > 0 && (
          <p className="text-sm text-gray-400">
            Tracking {toolCount} tools
            {refreshAgo && ` · Updated ${refreshAgo}`}
          </p>
        )}

        {/* Search */}
        <div className="mt-6 max-w-xl mx-auto">
          <form action="/search" method="GET">
            <input
              type="text"
              name="q"
              placeholder="Search AI agent tools..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </form>
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
      <section className="bg-gray-50 rounded-xl p-6 text-center">
        <h3 className="font-semibold text-gray-900 mb-1">Stay Updated</h3>
        <p className="text-sm text-gray-600 mb-3">
          Get a weekly digest of new AI agent tools and trends.
        </p>
        <form className="flex gap-2 max-w-md mx-auto">
          <input
            type="email"
            placeholder="your@email.com"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
          >
            Subscribe
          </button>
        </form>
      </section>
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
