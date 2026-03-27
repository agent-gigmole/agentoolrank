import { searchTools } from "@/lib/queries";
import { ToolCard } from "@/components/ToolCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search AI Agent Tools",
  description: "Search across hundreds of AI agent tools by name, description, or category.",
};

type Props = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const tools = query ? await searchTools(query, 50) : [];

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Search</h1>

      <form action="/search" method="GET" className="mb-8">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Search AI agent tools..."
          className="w-full max-w-xl px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoFocus
        />
      </form>

      {query && (
        <p className="text-sm text-gray-500 mb-4">
          {tools.length} result{tools.length !== 1 ? "s" : ""} for &quot;{query}&quot;
        </p>
      )}

      {tools.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      ) : query ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-2">No tools found for &quot;{query}&quot;</p>
          <p className="text-sm text-gray-400">
            Try a different search term, or{" "}
            <a href="/" className="text-blue-600 hover:underline">browse by category</a>.
          </p>
        </div>
      ) : null}
    </main>
  );
}
