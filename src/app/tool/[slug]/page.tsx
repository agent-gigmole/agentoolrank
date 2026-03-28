import { notFound } from "next/navigation";
import Link from "next/link";
import { getToolBySlug, getTools } from "@/lib/queries";
import { Breadcrumbs, BreadcrumbJsonLd } from "@/components/Breadcrumbs";
import type { Metadata } from "next";
import type { Tool } from "@/lib/schema";

export const revalidate = 86400; // 24 hours

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool) return {};
  return {
    title: `${tool.name} — AI Agent Tool Review & Alternatives`,
    description: tool.tagline || tool.description.slice(0, 160),
  };
}

function MetricCard({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="text-center p-3 bg-gray-50 rounded-lg">
      <div className="text-lg font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function formatStars(n: number | null): string | null {
  if (n === null) return null;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">{title}</h2>
      {children}
    </section>
  );
}

function JsonLd({ tool }: { tool: Tool }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://agentoolrank.com";
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    description: tool.description || tool.tagline,
    url: tool.website_url || `${baseUrl}/tool/${tool.id}`,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Cross-platform",
    offers: {
      "@type": "Offer",
      price: tool.pricing === "free" || tool.pricing === "open-source" ? "0" : undefined,
      priceCurrency: "USD",
    },
  };
  if (tool.logo_url) data.image = tool.logo_url;
  if (tool.github_url) data.downloadUrl = tool.github_url;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default async function ToolPage({ params }: Props) {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool) notFound();

  // Get alternatives
  const alternativeTools: Tool[] = [];
  if (tool.alternatives.length > 0) {
    for (const altId of tool.alternatives.slice(0, 4)) {
      const alt = await getToolBySlug(altId);
      if (alt) alternativeTools.push(alt);
    }
  }

  // Get same-category tools for comparison links
  const primaryCategory = tool.category_tags[0] ?? null;
  const categoryPeers = primaryCategory
    ? (await getTools({ category: primaryCategory, limit: 6, sort: "score" })).filter((t) => t.id !== tool.id)
    : [];

  return (
    <>
      <JsonLd tool={tool} />
      <BreadcrumbJsonLd items={[
        ...(tool.category_tags.length > 0 ? [{ label: tool.category_tags[0].replace(/-/g, " "), href: `/category/${tool.category_tags[0]}` }] : []),
        { label: tool.name },
      ]} />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs items={[
          ...(tool.category_tags.length > 0 ? [{ label: tool.category_tags[0].replace(/-/g, " "), href: `/category/${tool.category_tags[0]}` }] : []),
          { label: tool.name },
        ]} />
        {/* Hero */}
        <div className="flex items-start gap-4 mb-6">
          {tool.logo_url ? (
            <img src={tool.logo_url} alt="" className="w-16 h-16 rounded-xl object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-2xl font-bold text-gray-400">
              {tool.name.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{tool.name}</h1>
            <p className="text-gray-600 mt-1">{tool.tagline}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                tool.pricing === "open-source" ? "bg-green-100 text-green-800" :
                tool.pricing === "free" ? "bg-blue-100 text-blue-800" :
                tool.pricing === "freemium" ? "bg-yellow-100 text-yellow-800" :
                "bg-purple-100 text-purple-800"
              }`}>
                {tool.pricing}
              </span>
              {tool.category_tags.map((tag) => (
                <Link key={tag} href={`/category/${tag}`} className="text-xs text-blue-600 hover:underline">
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-3 mb-8">
          {tool.website_url && (
            <a
              href={tool.affiliate_url || tool.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              Visit Website
            </a>
          )}
          {tool.github_url && (
            <a
              href={tool.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              View on GitHub
            </a>
          )}
        </div>

        {/* Metrics Panel */}
        {tool.github_stars !== null && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <MetricCard label="Stars" value={formatStars(tool.github_stars)} />
            <MetricCard label="Stars/month" value={tool.star_velocity_30d !== null ? `+${tool.star_velocity_30d.toFixed(0)}` : null} />
            <MetricCard label="Commits (90d)" value={tool.commit_count_90d?.toString() ?? null} />
            <MetricCard label="Releases (6m)" value={tool.release_count_6m?.toString() ?? null} />
          </div>
        )}

        {/* Description */}
        {tool.description && (
          <Section title="Overview">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{tool.description}</p>
          </Section>
        )}

        {/* Pros / Cons */}
        {(tool.pros.length > 0 || tool.cons.length > 0) && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {tool.pros.length > 0 && (
              <div>
                <h3 className="font-semibold text-green-700 mb-2">Pros</h3>
                <ul className="space-y-1">
                  {tool.pros.map((pro, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-1.5">
                      <span className="text-green-500 mt-0.5">+</span> {pro}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {tool.cons.length > 0 && (
              <div>
                <h3 className="font-semibold text-red-700 mb-2">Cons</h3>
                <ul className="space-y-1">
                  {tool.cons.map((con, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-1.5">
                      <span className="text-red-500 mt-0.5">-</span> {con}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Use Cases */}
        {tool.use_cases.length > 0 && (
          <Section title="Use Cases">
            <ul className="space-y-1">
              {tool.use_cases.map((uc, i) => (
                <li key={i} className="text-sm text-gray-700">• {uc}</li>
              ))}
            </ul>
          </Section>
        )}

        {/* Getting Started */}
        {tool.getting_started && (
          <Section title="Getting Started">
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-line">
              {tool.getting_started}
            </div>
          </Section>
        )}

        {/* Alternatives */}
        {alternativeTools.length > 0 && (
          <Section title="Alternatives">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {alternativeTools.map((alt) => (
                <Link
                  key={alt.id}
                  href={`/tool/${alt.id}`}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-400 transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-400">
                    {alt.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{alt.name}</div>
                    <div className="text-xs text-gray-500">{alt.tagline}</div>
                  </div>
                  {alt.github_stars !== null && (
                    <span className="ml-auto text-xs text-gray-400">⭐ {formatStars(alt.github_stars)}</span>
                  )}
                </Link>
              ))}
            </div>
          </Section>
        )}
        {/* Compare with peers */}
        {categoryPeers.length > 0 && (
          <Section title={`Compare ${tool.name}`}>
            <div className="flex flex-wrap gap-2">
              {categoryPeers.map((peer) => {
                const [a, b] = tool.id < peer.id ? [tool.id, peer.id] : [peer.id, tool.id];
                return (
                  <Link
                    key={peer.id}
                    href={`/compare/${a}-vs-${b}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-full hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                  >
                    {tool.name} <span className="text-gray-400">vs</span> {peer.name}
                  </Link>
                );
              })}
            </div>
          </Section>
        )}
      </main>
    </>
  );
}
