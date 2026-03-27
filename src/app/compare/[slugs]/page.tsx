import { notFound } from "next/navigation";
import Link from "next/link";
import { getToolBySlug } from "@/lib/queries";
import type { Tool } from "@/lib/schema";
import type { Metadata } from "next";

export const revalidate = 86400; // 24h

type Props = { params: Promise<{ slugs: string }> };

function parseSlugs(slugs: string): [string, string] | null {
  const parts = slugs.split("-vs-");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return [parts[0], parts[1]];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slugs } = await params;
  const parsed = parseSlugs(slugs);
  if (!parsed) return {};
  const [a, b] = await Promise.all([getToolBySlug(parsed[0]), getToolBySlug(parsed[1])]);
  if (!a || !b) return {};
  return {
    title: `${a.name} vs ${b.name} — AI Agent Tool Comparison`,
    description: `Compare ${a.name} and ${b.name}. Side-by-side comparison of features, GitHub activity, pros & cons.`,
  };
}

function formatStars(n: number | null): string {
  if (n === null) return "N/A";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function MetricRow({ label, a, b, higherIsBetter = true }: {
  label: string;
  a: number | null;
  b: number | null;
  higherIsBetter?: boolean;
}) {
  const aVal = a ?? 0;
  const bVal = b ?? 0;
  const aWins = higherIsBetter ? aVal > bVal : aVal < bVal;
  const bWins = higherIsBetter ? bVal > aVal : bVal < aVal;

  return (
    <tr className="border-b border-gray-100">
      <td className="py-3 px-4 text-sm text-gray-500 text-center">{label}</td>
      <td className={`py-3 px-4 text-sm text-center font-medium ${aWins ? "text-green-700 bg-green-50" : "text-gray-700"}`}>
        {a !== null ? formatStars(a) : "—"}
      </td>
      <td className={`py-3 px-4 text-sm text-center font-medium ${bWins ? "text-green-700 bg-green-50" : "text-gray-700"}`}>
        {b !== null ? formatStars(b) : "—"}
      </td>
    </tr>
  );
}

function ListCompare({ label, a, b }: { label: string; a: string[]; b: string[] }) {
  if (a.length === 0 && b.length === 0) return null;
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{label}</h2>
      <div className="grid md:grid-cols-2 gap-6">
        {[a, b].map((items, i) => (
          <ul key={i} className="space-y-2">
            {items.map((item, j) => (
              <li key={j} className="text-sm text-gray-700 flex items-start gap-1.5">
                <span className={`mt-0.5 ${label === "Pros" ? "text-green-500" : label === "Cons" ? "text-red-500" : "text-blue-500"}`}>
                  {label === "Pros" ? "+" : label === "Cons" ? "-" : "•"}
                </span>
                {item}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  );
}

export default async function ComparePage({ params }: Props) {
  const { slugs } = await params;
  const parsed = parseSlugs(slugs);
  if (!parsed) notFound();

  const [toolA, toolB] = await Promise.all([
    getToolBySlug(parsed[0]),
    getToolBySlug(parsed[1]),
  ]);

  if (!toolA || !toolB) notFound();

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
        {toolA.name} vs {toolB.name}
      </h1>
      <p className="text-gray-500 text-center mb-8">
        Side-by-side comparison of two AI agent tools
      </p>

      {/* Header cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {[toolA, toolB].map((tool) => (
          <div key={tool.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              {tool.logo_url ? (
                <img src={tool.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-400">
                  {tool.name.charAt(0)}
                </div>
              )}
              <div>
                <Link href={`/tool/${tool.id}`} className="font-semibold text-gray-900 hover:underline">
                  {tool.name}
                </Link>
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                  tool.pricing === "open-source" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                }`}>
                  {tool.pricing}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600">{tool.tagline}</p>
          </div>
        ))}
      </div>

      {/* Metrics table */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Metrics</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-2 px-4 text-sm text-gray-500 font-normal"></th>
                <th className="py-2 px-4 text-sm font-semibold text-gray-900">{toolA.name}</th>
                <th className="py-2 px-4 text-sm font-semibold text-gray-900">{toolB.name}</th>
              </tr>
            </thead>
            <tbody>
              <MetricRow label="Stars" a={toolA.github_stars} b={toolB.github_stars} />
              <MetricRow label="Star velocity /mo" a={toolA.star_velocity_30d} b={toolB.star_velocity_30d} />
              <MetricRow label="Commits (90d)" a={toolA.commit_count_90d} b={toolB.commit_count_90d} />
              <MetricRow label="Releases (6m)" a={toolA.release_count_6m} b={toolB.release_count_6m} />
              <MetricRow label="Overall score" a={toolA.score} b={toolB.score} />
            </tbody>
          </table>
        </div>
      </section>

      {/* Pros comparison */}
      <ListCompare label="Pros" a={toolA.pros} b={toolB.pros} />
      <ListCompare label="Cons" a={toolA.cons} b={toolB.cons} />
      <ListCompare label="Use Cases" a={toolA.use_cases} b={toolB.use_cases} />

      {/* CTA */}
      <div className="grid md:grid-cols-2 gap-4 mt-8">
        {[toolA, toolB].map((tool) => (
          <Link
            key={tool.id}
            href={`/tool/${tool.id}`}
            className="block text-center py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            View {tool.name} Details
          </Link>
        ))}
      </div>
    </main>
  );
}
