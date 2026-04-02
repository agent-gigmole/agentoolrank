import { notFound } from "next/navigation";
import Link from "next/link";
import { getToolBySlug, getTools, getToolSnapshots } from "@repo/db/queries";
import { Breadcrumbs, BreadcrumbJsonLd } from "@repo/ui/Breadcrumbs";
import { StarChart } from "@repo/ui/StarChart";
import type { Metadata } from "next";
import type { Tool } from "@repo/db/schema";

export const revalidate = 86400; // 24 hours

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool) return {};
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://aimarketrank.com";
  const desc = tool.tagline || tool.description.slice(0, 160);
  const ogUrl = `${baseUrl}/api/og?title=${encodeURIComponent(tool.name)}&icon=🔧&tools=${tool.github_stars || 0}`;

  return {
    title: `${tool.name} — AI Marketing Tool Review & Alternatives`,
    description: desc,
    openGraph: {
      title: tool.name,
      description: desc,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: tool.name,
      description: desc,
      images: [ogUrl],
    },
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

interface ToolIntelligence {
  capabilities?: string[];
  integrations?: string[];
  sdk_languages?: string[];
  deployment?: string[];
  pricing_detail?: { free_tier?: string; paid_starts_at?: string };
  limitations?: string[];
  best_for?: string[];
  not_for?: string[];
  key_differentiator?: string;
}

function parseIntelligence(raw: string): ToolIntelligence | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    return parsed as ToolIntelligence;
  } catch {
    return null;
  }
}

function IntelligenceSection({ intel }: { intel: ToolIntelligence }) {
  return (
    <div className="space-y-6">
      {/* Key Differentiator */}
      {intel.key_differentiator && (
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">Key Differentiator</div>
          <p className="text-sm text-gray-800">{intel.key_differentiator}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Capabilities */}
        {intel.capabilities && intel.capabilities.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <span className="text-blue-500">⚡</span> Capabilities
            </h3>
            <ul className="space-y-1">
              {intel.capabilities.map((cap, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-start gap-1.5">
                  <span className="text-gray-300 mt-0.5">•</span> {cap}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Integrations */}
        {intel.integrations && intel.integrations.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <span className="text-green-500">🔗</span> Integrations
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {intel.integrations.map((integ, i) => (
                <span key={i} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md">
                  {integ}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Best For */}
        {intel.best_for && intel.best_for.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <span className="text-green-500">✓</span> Best For
            </h3>
            <ul className="space-y-1">
              {intel.best_for.map((bf, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-start gap-1.5">
                  <span className="text-green-400 mt-0.5">✓</span> {bf}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Not For */}
        {intel.not_for && intel.not_for.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <span className="text-red-400">✗</span> Not Ideal For
            </h3>
            <ul className="space-y-1">
              {intel.not_for.map((nf, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-start gap-1.5">
                  <span className="text-red-300 mt-0.5">✗</span> {nf}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* SDK Languages */}
        {intel.sdk_languages && intel.sdk_languages.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Languages</h3>
            <div className="flex flex-wrap gap-1.5">
              {intel.sdk_languages.map((lang, i) => (
                <span key={i} className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded-md font-mono">
                  {lang}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Deployment */}
        {intel.deployment && intel.deployment.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Deployment</h3>
            <div className="flex flex-wrap gap-1.5">
              {intel.deployment.map((dep, i) => (
                <span key={i} className="text-xs px-2 py-1 bg-orange-50 text-orange-700 rounded-md">
                  {dep}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Pricing Detail */}
        {intel.pricing_detail && (intel.pricing_detail.free_tier || intel.pricing_detail.paid_starts_at) && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Pricing Detail</h3>
            <div className="text-xs text-gray-600 space-y-1">
              {intel.pricing_detail.free_tier && (
                <div><span className="text-green-600 font-medium">Free:</span> {intel.pricing_detail.free_tier}</div>
              )}
              {intel.pricing_detail.paid_starts_at && (
                <div><span className="text-blue-600 font-medium">Paid:</span> {intel.pricing_detail.paid_starts_at}</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Limitations */}
      {intel.limitations && intel.limitations.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
            <span className="text-amber-500">⚠</span> Known Limitations
          </h3>
          <ul className="space-y-1">
            {intel.limitations.map((lim, i) => (
              <li key={i} className="text-sm text-gray-600 flex items-start gap-1.5">
                <span className="text-amber-400 mt-0.5">⚠</span> {lim}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function appendUtm(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set("utm_source", "aimarketrank");
    u.searchParams.set("utm_medium", "directory");
    u.searchParams.set("utm_campaign", "tool_page");
    return u.toString();
  } catch {
    return url;
  }
}

function getOutboundUrl(tool: Tool): string {
  if (tool.affiliate_url) return tool.affiliate_url;
  if (tool.website_url) return appendUtm(tool.website_url);
  return "";
}

function JsonLd({ tool }: { tool: Tool }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://aimarketrank.com";
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

  // Get star history for chart
  const snapshots = await getToolSnapshots(tool.id);

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
              href={getOutboundUrl(tool)}
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

        {/* Star Growth Chart */}
        {tool.github_stars !== null && (
          <StarChart
            snapshots={snapshots}
            currentStars={tool.github_stars}
            velocity={tool.star_velocity_30d}
            name={tool.name}
          />
        )}

        {/* Description */}
        {tool.description && (
          <Section title="Overview">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{tool.description}</p>
          </Section>
        )}

        {/* Tool Intelligence */}
        {(() => {
          const intel = parseIntelligence(tool.intelligence);
          if (!intel) return null;
          return (
            <Section title="Deep Analysis">
              <IntelligenceSection intel={intel} />
            </Section>
          );
        })()}

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
