import Link from "next/link";
import { db } from "@/lib/db";
import { Breadcrumbs, BreadcrumbJsonLd } from "@/components/Breadcrumbs";
import { CategoryTabs } from "./CategoryTabs";
import type { Metadata } from "next";

export const revalidate = 3600; // 1 hour

export const metadata: Metadata = {
  title: "AI Marketing Blueprints — Ready-to-Build Tool Combinations | AIMarketRank",
  description:
    "Browse 70+ AI project blueprints with step-by-step execution plans. Each blueprint shows exactly which tools to use, how to combine them, and what it costs. From RAG chatbots to trading systems.",
  openGraph: {
    title: "AI Marketing Blueprints — Ready-to-Build Tool Combinations",
    description: "70+ blueprints with execution plans, cost estimates, and tool stacks for AI projects.",
  },
  alternates: {
    canonical: "https://aimarketrank.com/blueprint",
    languages: { zh: "https://aimarketrank.com/zh/blueprint" },
  },
};

interface BlueprintRow {
  slug: string;
  title: string;
  description: string;
  icon: string;
  difficulty: string;
  layers: string;
  tags: string;
  created_at: string;
}

const difficultyColors: Record<string, string> = {
  beginner: "bg-green-100 text-green-700",
  intermediate: "bg-yellow-100 text-yellow-700",
  advanced: "bg-red-100 text-red-700",
};

const tagLabels: Record<string, string> = {
  "side-project": "Side Project",
  "startup-mvp": "Startup MVP",
  "enterprise": "Enterprise",
  "open-source": "Open Source",
  "low-cost": "Low Cost",
  "requires-dev": "Requires Dev",
  "no-code": "No-Code",
  "high-risk": "High Risk",
  "proven-model": "Proven Model",
};

function parseLayers(layersStr: string): Array<{ name: string; tools: Array<{ tool_id: string }> }> {
  try { return JSON.parse(layersStr); } catch { return []; }
}

function parseTags(tagsStr: string): string[] {
  try { return JSON.parse(tagsStr); } catch { return []; }
}

export default async function BlueprintIndexPage() {
  // Curated blueprints (pre-built, high quality)
  const curatedResult = await db.execute(
    "SELECT slug, title, description, icon, difficulty, layers, tags, created_at FROM stacks WHERE slug NOT LIKE 'custom-%' ORDER BY title"
  );
  const curated = curatedResult.rows as unknown as BlueprintRow[];

  // Community blueprints (user-generated via AI search)
  const communityResult = await db.execute(
    "SELECT slug, title, description, icon, difficulty, layers, tags, created_at FROM stacks WHERE slug LIKE 'custom-%' ORDER BY created_at DESC"
  );
  const community = communityResult.rows as unknown as BlueprintRow[];

  // Group curated by category (infer from tags or title keywords)
  const categories = groupByCategory(curated);

  return (
    <>
      <BreadcrumbJsonLd items={[{ label: "Blueprints" }]} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "AI Marketing Blueprints",
            description: "Ready-to-build AI project blueprints with tool combinations and execution plans.",
            numberOfItems: curated.length + community.length,
          }),
        }}
      />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: "Blueprints" }]} />

        {/* Hero */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            AI Marketing Blueprints
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl">
            {curated.length + community.length} ready-to-build blueprints with step-by-step execution plans,
            tool recommendations, and cost estimates. Pick one and start building.
          </p>
          <div className="mt-4 flex gap-3">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Generate Your Own Blueprint
            </Link>
            <a
              href="#community"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
            >
              Community Blueprints ({community.length})
            </a>
          </div>
        </div>

        {/* Sticky Category Tabs */}
        <CategoryTabs
          categories={categories.map((c) => ({ name: c.name, slug: c.slug, icon: c.icon, count: c.blueprints.length }))}
          hasCommunity={community.length > 0}
          communityCount={community.length}
        />

        {/* Curated Blueprints by Category */}
        {categories.map(({ name, slug: catSlug, icon: catIcon, blueprints }) => (
          <section key={catSlug} id={catSlug} className="mb-10 scroll-mt-24">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>{catIcon}</span>
              {name}
              <span className="text-sm font-normal text-gray-400">({blueprints.length})</span>
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {blueprints.map((bp) => (
                <BlueprintCard key={bp.slug} bp={bp} />
              ))}
            </div>
          </section>
        ))}

        {/* Community Blueprints */}
        {community.length > 0 && (
          <section id="community" className="mb-10 pt-8 border-t border-gray-200">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                Community Blueprints
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">NEW</span>
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Generated by users with our AI Blueprint Generator. <Link href="/search" className="text-blue-600 hover:underline">Create yours</Link>
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {community.map((bp) => (
                <BlueprintCard key={bp.slug} bp={bp} isCommunity />
              ))}
            </div>
          </section>
        )}

        {/* SEO footer text */}
        <div className="mt-12 pt-8 border-t border-gray-100 text-sm text-gray-500 max-w-2xl">
          <h2 className="font-semibold text-gray-700 mb-2">What is an AI Marketing Blueprint?</h2>
          <p>
            An AI Marketing Blueprint is a curated combination of tools, frameworks, and services designed to solve
            a specific problem. Each blueprint includes an execution plan with concrete steps, cost estimates,
            risk factors, and alternative tools — so you can start building immediately instead of spending
            weeks researching which tools to use together.
          </p>
        </div>
      </main>
    </>
  );
}

function BlueprintCard({ bp, isCommunity }: { bp: BlueprintRow; isCommunity?: boolean }) {
  const layers = parseLayers(bp.layers);
  const tags = parseTags(bp.tags || "[]");
  const toolCount = layers.reduce((s, l) => s + (l.tools?.length || 0), 0);

  return (
    <Link
      href={`/blueprint/${bp.slug}`}
      className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start gap-3 mb-2">
        <span className="text-2xl shrink-0">{bp.icon || "🔧"}</span>
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm leading-tight">
            {bp.title}
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${difficultyColors[bp.difficulty] ?? "bg-gray-100 text-gray-500"}`}>
              {bp.difficulty}
            </span>
            <span className="text-[10px] text-gray-400">
              {layers.length} layers · {toolCount} tools
            </span>
            {isCommunity && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                community
              </span>
            )}
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-500 line-clamp-2 mb-2">
        {bp.description}
      </p>
      {tags.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
              {tagLabels[tag] || tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

interface CategoryGroup {
  name: string;
  slug: string;
  icon: string;
  blueprints: BlueprintRow[];
}

const CATEGORIES = [
  { name: "AI Assistants & Chatbots", slug: "assistants", icon: "💬", pattern: /chat|rag|support|assistant|customer|conversational/ },
  { name: "Development & Code", slug: "development", icon: "🛠", pattern: /code|dev|review|testing|debug|ide|engineer/ },
  { name: "Data & Analytics", slug: "data", icon: "📊", pattern: /data|analy|monitor|dashboard|quant|trad|financ/ },
  { name: "Content & Marketing", slug: "content", icon: "✍️", pattern: /content|blog|seo|market|social|video|write/ },
  { name: "Business Automation", slug: "automation", icon: "⚡", pattern: /auto|workflow|business|crm|email|e-commerce|saas/ },
  { name: "Research & Science", slug: "research", icon: "🔬", pattern: /research|paper|science|academic|study/ },
  { name: "Other", slug: "other", icon: "🧩", pattern: null },
];

function groupByCategory(blueprints: BlueprintRow[]): CategoryGroup[] {
  const groups: Record<string, BlueprintRow[]> = {};
  for (const cat of CATEGORIES) groups[cat.slug] = [];

  for (const bp of blueprints) {
    const text = (bp.title + " " + bp.description).toLowerCase();
    let matched = false;
    for (const cat of CATEGORIES) {
      if (cat.pattern && cat.pattern.test(text)) {
        groups[cat.slug].push(bp);
        matched = true;
        break;
      }
    }
    if (!matched) groups["other"].push(bp);
  }

  return CATEGORIES
    .filter((cat) => groups[cat.slug].length > 0)
    .map((cat) => ({ name: cat.name, slug: cat.slug, icon: cat.icon, blueprints: groups[cat.slug] }));
}
