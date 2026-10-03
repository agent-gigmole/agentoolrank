import { notFound } from "next/navigation";
import { getTools, getCategories, getDownloadRows, getToolBySlug } from "@repo/db/queries";
import { featuredSlugs } from "@/lib/paid";
import Link from "next/link";
import { DOWNLOAD_CATEGORY_MIN, rankByDownloads } from "@/lib/downloads";
import { ToolCard } from "@/components/ToolCard";
import { Breadcrumbs, BreadcrumbJsonLd } from "@repo/ui/Breadcrumbs";
import type { Metadata } from "next";
import { categoryTitle } from "@/lib/alternatives";
import { clampDescription } from "@/lib/titles";

export const revalidate = 43200;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) return {};
  const top = await getTools({ category: slug, limit: 3 });
  return {
    title: categoryTitle(category.name, category.tool_count ?? 0, new Date().getFullYear()),
    description: clampDescription(`Compare the best open-source ${category.name.toLowerCase()}${top.length ? ` like ${top.map((t) => t.name).join(", ")}` : ""}, ranked by live GitHub stars, growth and commit activity.`),
    alternates: { canonical: `/category/${slug}` },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const [categories, tools] = await Promise.all([
    getCategories(),
    getTools({ category: slug, limit: 100 }),
  ]);

  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();
  const dlCount = rankByDownloads(await getDownloadRows(), slug).length;
  // Paid featured tools also show at the top of their own category (the $49 slot: homepage + category).
  const featuredHere = (await Promise.all((await featuredSlugs()).map((id) => getToolBySlug(id)))).filter(
    (t): t is NonNullable<typeof t> => t !== null && (t.category_tags ?? []).includes(slug),
  );

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://agentoolrank.com";
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Best ${category.name}`,
    description: category.description,
    url: `${baseUrl}/category/${slug}`,
    numberOfItems: tools.length,
    hasPart: tools.slice(0, 20).map((t) => ({
      "@type": "SoftwareApplication",
      name: t.name,
      url: `${baseUrl}/tool/${t.id}`,
    })),
  };

  return (
    <>
      <BreadcrumbJsonLd items={[{ label: category.name }]} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: category.name }]} />
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{category.icon}</span>
            <h1 className="text-3xl font-bold text-gray-900">{categoryTitle(category.name, tools.length, new Date().getFullYear())}</h1>
          </div>
        <p className="text-gray-600">{category.description}</p>
        {tools.length >= 3 && (
          <p className="text-gray-600 mt-2">
            Top picks right now: {tools.slice(0, 3).map((t) => t.name).join(", ")}. Every tool below is open source and ranked by
            live GitHub activity (stars, 30-day star growth, commits and releases), refreshed daily.
          </p>
        )}
        <p className="text-sm text-gray-400 mt-1">
          {tools.length} tools
          {dlCount >= DOWNLOAD_CATEGORY_MIN && (
            <>
              {" · "}
              <Link href={`/downloads/${category.slug}`} className="text-blue-600 hover:underline">{dlCount} by npm / PyPI downloads →</Link>
            </>
          )}
        </p>
      </div>

      {featuredHere.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Featured in {category.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {featuredHere.map((tool) => (
              <div key={tool.id} className="relative">
                <span className="absolute -top-2 right-3 z-10 text-[10px] uppercase tracking-wide bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">Sponsored</span>
                <ToolCard tool={tool} />
              </div>
            ))}
          </div>
        </section>
      )}

      {tools.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-2">No tools in this category yet.</p>
          <p className="text-sm text-gray-400">Check back soon — we add new tools daily.</p>
        </div>
      )}
    </main>
    </>
  );
}
