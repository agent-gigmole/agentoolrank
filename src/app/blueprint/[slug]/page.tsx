import { notFound } from "next/navigation";
import Link from "next/link";
import { getStackBySlug, getStacks, getToolBySlug } from "@/lib/queries";
import { Breadcrumbs, BreadcrumbJsonLd } from "@/components/Breadcrumbs";
import { StackFlow } from "@/components/StackFlow";
import { InstructionBlock } from "@/components/InstructionBlock";
import type { Metadata } from "next";
import type { Tool } from "@/lib/schema";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const stack = await getStackBySlug(slug);
  if (!stack) return {};
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://agentoolrank.com";
  const totalTools = stack.layers.reduce((s: number, l: any) => s + l.tools.length, 0);
  const layerNames = stack.layers.map((l: any) => l.name).join("|");
  const ogUrl = `${baseUrl}/api/og?title=${encodeURIComponent(stack.title)}&icon=${encodeURIComponent(stack.icon)}&difficulty=${stack.difficulty}&layers=${stack.layers.length}&tools=${totalTools}&desc=${encodeURIComponent((stack.description || "").slice(0, 120))}&layer_names=${encodeURIComponent(layerNames)}`;

  return {
    title: `${stack.title} — AI Project Blueprint | AgenToolRank`,
    description: `${stack.description} ${stack.layers.length} layers, ${totalTools} tools. Step-by-step execution plan with tool recommendations.`,
    alternates: {
      canonical: `${baseUrl}/blueprint/${slug}`,
    },
    openGraph: {
      title: stack.title,
      description: stack.description,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: stack.title,
      description: stack.description,
      images: [ogUrl],
    },
  };
}

export async function generateStaticParams() {
  const stacks = await getStacks();
  return stacks.map((s) => ({ slug: s.slug }));
}

const difficultyLabels: Record<string, { label: string; color: string }> = {
  beginner: { label: "Beginner", color: "bg-green-100 text-green-700" },
  intermediate: { label: "Intermediate", color: "bg-yellow-100 text-yellow-700" },
  advanced: { label: "Advanced", color: "bg-red-100 text-red-700" },
};

export default async function BlueprintDetailPage({ params }: Props) {
  const { slug } = await params;
  const stack = await getStackBySlug(slug);
  if (!stack) notFound();

  const isCustom = slug.startsWith("custom-");

  // Fetch tool details for all referenced tools
  const toolIds = new Set<string>();
  for (const layer of stack.layers) {
    for (const t of layer.tools) toolIds.add(t.tool_id);
  }
  const toolMap = new Map<string, Tool>();
  for (const id of toolIds) {
    const tool = await getToolBySlug(id);
    if (tool) toolMap.set(id, tool);
  }

  const diff = difficultyLabels[stack.difficulty] ?? difficultyLabels.intermediate;
  const totalTools = stack.layers.reduce((s, l) => s + l.tools.length, 0);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://agentoolrank.com";
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: stack.title,
    description: stack.description,
    url: `${baseUrl}/blueprint/${slug}`,
    step: stack.layers.map((layer, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: `Choose ${layer.name}`,
      text: layer.description,
      itemListElement: layer.tools.map((t) => ({
        "@type": "HowToDirection",
        text: `${t.role}: ${toolMap.get(t.tool_id)?.name ?? t.tool_id} — ${t.note}`,
      })),
    })),
  };

  return (
    <>
      <BreadcrumbJsonLd items={[
        { label: "Blueprints", href: "/blueprint" },
        { label: stack.title },
      ]} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs items={[
          { label: "Blueprints", href: "/blueprint" },
          { label: stack.title },
        ]} />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{stack.icon}</span>
            <h1 className="text-3xl font-bold text-gray-900">{stack.title}</h1>
          </div>
          <p className="text-gray-600 mb-3">{stack.description}</p>
          <div className="flex items-center gap-3 text-sm">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${diff.color}`}>
              {diff.label}
            </span>
            <span className="text-gray-400">
              {stack.layers.length} layers · {totalTools} tools
            </span>
            {isCustom && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                Community
              </span>
            )}
          </div>
        </div>

        {/* Stack Flow Diagram */}
        <StackFlow
          layers={stack.layers.map((layer) => ({
            ...layer,
            tools: layer.tools.map((t) => {
              const tool = toolMap.get(t.tool_id);
              return {
                ...t,
                name: tool?.name ?? t.tool_id,
                stars: tool?.github_stars ?? null,
                pricing: tool?.pricing ?? undefined,
              };
            }),
          }))}
        />

        {/* Compare tools in this stack */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Compare Tools in This Blueprint</h2>
          <div className="flex flex-wrap gap-2">
            {stack.layers.filter((l) => l.tools.length >= 2).map((layer) => {
              const tools = layer.tools.filter((t) => toolMap.has(t.tool_id));
              if (tools.length < 2) return null;
              const [a, b] = tools[0].tool_id < tools[1].tool_id
                ? [tools[0], tools[1]]
                : [tools[1], tools[0]];
              const nameA = toolMap.get(a.tool_id)?.name ?? a.tool_id;
              const nameB = toolMap.get(b.tool_id)?.name ?? b.tool_id;
              return (
                <Link
                  key={`${a.tool_id}-${b.tool_id}`}
                  href={`/compare/${a.tool_id}-vs-${b.tool_id}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-full hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                >
                  {nameA} <span className="text-gray-400">vs</span> {nameB}
                </Link>
              );
            })}
          </div>
        </section>

        {/* Setup Instructions — copy & paste into terminal */}
        <InstructionBlock
          stack={{
            title: stack.title,
            icon: stack.icon,
            layers: stack.layers.map((layer) => ({
              ...layer,
              tools: layer.tools.map((t) => ({
                ...t,
                name: toolMap.get(t.tool_id)?.name ?? t.tool_id,
              })),
            })),
          }}
        />

        {/* CTA to generate own blueprint */}
        <section className="mt-10 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Build Your Own Blueprint</h2>
          <p className="text-sm text-gray-600 mb-4">
            Describe your project and our AI will generate a custom blueprint with the best tool combinations for your needs.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Generate Blueprint
          </Link>
        </section>
      </main>
    </>
  );
}
