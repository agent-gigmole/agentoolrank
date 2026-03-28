import Link from "next/link";
import { searchTools, searchStacks, getToolBySlug } from "@/lib/queries";
import { ToolCard } from "@/components/ToolCard";
import { StackFlow } from "@/components/StackFlow";
import type { Metadata } from "next";
import type { Tool } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Search AI Agent Tools & Stacks",
  description: "Describe what you want to build — find the right AI agent tools and see how to assemble them into a working stack.",
};

type Props = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const [tools, stacks] = query
    ? await Promise.all([searchTools(query, 30), searchStacks(query, 5)])
    : [[], []];

  // Enrich stack tools with actual tool data
  const enrichedStacks = await Promise.all(
    stacks.map(async (stack) => {
      const enrichedLayers = await Promise.all(
        stack.layers.map(async (layer) => ({
          ...layer,
          tools: await Promise.all(
            layer.tools.map(async (t) => {
              const tool = await getToolBySlug(t.tool_id);
              return {
                ...t,
                name: tool?.name ?? t.tool_id,
                stars: tool?.github_stars ?? null,
                pricing: tool?.pricing ?? undefined,
              };
            })
          ),
        }))
      );
      return { ...stack, layers: enrichedLayers };
    })
  );

  const hasResults = tools.length > 0 || stacks.length > 0;

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        What do you want to build?
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Describe your project — we'll find the tools and show you how to assemble them.
      </p>

      <form action="/search" method="GET" className="mb-8">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="e.g. 我想做量化金融开发 / Build a RAG chatbot / AI code reviewer..."
          className="w-full max-w-2xl px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoFocus
        />
      </form>

      {query && !hasResults && (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-2">
            No results for &quot;{query}&quot;
          </p>
          <p className="text-sm text-gray-400">
            Try describing what you want to build in different words, or{" "}
            <Link href="/stack" className="text-blue-600 hover:underline">
              browse pre-built stacks
            </Link>
            .
          </p>
        </div>
      )}

      {/* Matching Stacks — shown first, with flow diagram */}
      {enrichedStacks.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            Recommended Stacks
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Pre-assembled tool combinations matching your query
          </p>

          <div className="space-y-8">
            {enrichedStacks.map((stack) => (
              <div key={stack.slug} className="border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{stack.icon}</span>
                  <Link
                    href={`/stack/${stack.slug}`}
                    className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    {stack.title}
                  </Link>
                </div>
                <p className="text-sm text-gray-500 mb-4">{stack.description}</p>
                <StackFlow layers={stack.layers} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Matching Tools */}
      {tools.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            Individual Tools
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            {tools.length} tool{tools.length !== 1 ? "s" : ""} matching &quot;{query}&quot;
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
