import { getNewTools } from "@/lib/queries";
import { ToolCard } from "@/components/ToolCard";
import type { Metadata } from "next";

export const revalidate = 43200; // 12h

export const metadata: Metadata = {
  title: "New AI Marketing Tools This Week",
  description: "Discover the latest AI marketing tools added to our directory. Updated daily.",
};

export default async function NewToolsPage() {
  const thisWeek = await getNewTools(7, 50);
  const lastWeek = await getNewTools(14, 50);
  // Filter last week to exclude this week's tools
  const thisWeekIds = new Set(thisWeek.map((t) => t.id));
  const previousWeek = lastWeek.filter((t) => !thisWeekIds.has(t.id));

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">New This Week</h1>
      <p className="text-gray-600 mb-8">
        Recently added AI marketing tools, sorted by date.
      </p>

      {thisWeek.length > 0 ? (
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            This Week ({thisWeek.length} new)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {thisWeek.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      ) : (
        <div className="text-center py-12 mb-8">
          <p className="text-gray-500">No new tools added this week yet.</p>
          <p className="text-sm text-gray-400 mt-1">Check back tomorrow.</p>
        </div>
      )}

      {previousWeek.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-500 mb-4">
            Last Week ({previousWeek.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {previousWeek.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="bg-gray-50 rounded-xl p-6 text-center mt-12">
        <h3 className="font-semibold text-gray-900 mb-1">Never Miss a New Tool</h3>
        <p className="text-sm text-gray-600 mb-3">
          Weekly digest of new AI marketing tools delivered to your inbox.
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
