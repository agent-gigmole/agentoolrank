import { notFound } from "next/navigation";
import { getTools, getCategories } from "@repo/db/queries";
import { ToolCard } from "@/components/ToolCard";
import { Breadcrumbs, BreadcrumbJsonLd } from "@repo/ui/Breadcrumbs";
import type { Metadata } from "next";

export const revalidate = 43200;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) return {};
  return {
    title: `Best ${category.name} — AI Agent Tools Directory`,
    description: `Discover the best ${category.name.toLowerCase()} for AI agents. ${category.description}`,
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
            <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
          </div>
        <p className="text-gray-600">{category.description}</p>
        <p className="text-sm text-gray-400 mt-1">{tools.length} tools</p>
      </div>

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
