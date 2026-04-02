import Link from "next/link";
import { getComparisonPairs } from "@/lib/queries";
import type { Metadata } from "next";

export const revalidate = 43200; // 12h

export const metadata: Metadata = {
  title: "AI Marketing Tool Comparisons — Side-by-Side Reviews",
  description:
    "Compare top AI marketing tools head-to-head. Side-by-side feature comparisons, GitHub metrics, pros & cons for popular agent frameworks, coding assistants, and more.",
};

export default async function CompareIndexPage() {
  const pairs = await getComparisonPairs(8);

  // Group by category
  const byCategory = new Map<string, typeof pairs>();
  for (const pair of pairs) {
    if (!byCategory.has(pair.category)) byCategory.set(pair.category, []);
    byCategory.get(pair.category)!.push(pair);
  }

  const categoryLabels: Record<string, string> = {
    "agent-frameworks": "Agent Frameworks",
    "no-code-agent-builders": "No-Code / Low-Code",
    "coding-agents": "Coding Agents",
    "observability-evaluation": "Observability & Evaluation",
    "memory-knowledge": "Memory & Knowledge",
    "tool-integration": "Tool Integration",
    "browser-web-agents": "Browser & Web Agents",
    "agent-protocols": "Agent Protocols",
    "enterprise-agent-platforms": "Enterprise Platforms",
    "voice-agents": "Voice Agents",
    "sandboxes-execution": "Sandboxes & Execution",
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        AI Marketing Tool Comparisons
      </h1>
      <p className="text-gray-500 mb-8">
        {pairs.length} head-to-head comparisons across {byCategory.size}{" "}
        categories. Pick any pair to see detailed metrics, pros & cons.
      </p>

      {[...byCategory.entries()].map(([cat, catPairs]) => (
        <section key={cat} className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">
            {categoryLabels[cat] ?? cat}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {catPairs.map((pair) => (
              <Link
                key={`${pair.slugA}-vs-${pair.slugB}`}
                href={`/compare/${pair.slugA}-vs-${pair.slugB}`}
                className="block p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
              >
                <span className="text-sm font-medium text-gray-900">
                  {pair.nameA}
                </span>
                <span className="text-xs text-gray-400 mx-1.5">vs</span>
                <span className="text-sm font-medium text-gray-900">
                  {pair.nameB}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
