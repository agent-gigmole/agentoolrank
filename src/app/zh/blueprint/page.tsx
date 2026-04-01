import Link from "next/link";
import { db } from "@/lib/db";
import { Breadcrumbs, BreadcrumbJsonLd } from "@/components/Breadcrumbs";
import { CategoryTabs } from "@/app/blueprint/CategoryTabs";
import type { Metadata } from "next";

export const revalidate = 3600; // 1 hour

export const metadata: Metadata = {
  title: "AI 项目蓝图库 — 即用工具组合方案 | AgenToolRank",
  description:
    "浏览 70+ 个 AI 项目蓝图，附完整执行计划。每个蓝图精确展示该用哪些工具、如何组合、成本多少。从 RAG 聊天机器人到量化交易系统。",
  alternates: {
    canonical: "https://agentoolrank.com/zh/blueprint",
    languages: { en: "https://agentoolrank.com/blueprint" },
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

const difficultyLabels: Record<string, string> = {
  beginner: "入门",
  intermediate: "中级",
  advanced: "高级",
};

const difficultyColors: Record<string, string> = {
  beginner: "bg-green-100 text-green-700",
  intermediate: "bg-yellow-100 text-yellow-700",
  advanced: "bg-red-100 text-red-700",
};

const tagLabels: Record<string, string> = {
  "side-project": "个人项目",
  "startup-mvp": "创业 MVP",
  enterprise: "企业级",
  "open-source": "开源",
  "low-cost": "低成本",
  "requires-dev": "需要开发",
  "no-code": "无代码",
  "high-risk": "高风险",
  "proven-model": "成熟模式",
};

const categoryNameZh: Record<string, string> = {
  assistants: "AI 助手与聊天机器人",
  development: "开发与编程",
  data: "数据与分析",
  content: "内容与营销",
  automation: "业务自动化",
  research: "研究与科学",
  other: "其他",
};

function parseLayers(layersStr: string): Array<{ name: string; tools: Array<{ tool_id: string }> }> {
  try {
    return JSON.parse(layersStr);
  } catch {
    return [];
  }
}

function parseTags(tagsStr: string): string[] {
  try {
    return JSON.parse(tagsStr);
  } catch {
    return [];
  }
}

export default async function ZhBlueprintIndexPage() {
  const curatedResult = await db.execute(
    "SELECT slug, title, description, icon, difficulty, layers, tags, created_at FROM stacks WHERE slug NOT LIKE 'custom-%' ORDER BY title"
  );
  const curated = curatedResult.rows as unknown as BlueprintRow[];

  const communityResult = await db.execute(
    "SELECT slug, title, description, icon, difficulty, layers, tags, created_at FROM stacks WHERE slug LIKE 'custom-%' ORDER BY created_at DESC"
  );
  const community = communityResult.rows as unknown as BlueprintRow[];

  const categories = groupByCategory(curated);

  return (
    <>
      <BreadcrumbJsonLd items={[{ label: "蓝图库" }]} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "AI 项目蓝图库",
            description: "即用 AI 项目蓝图，附工具组合方案和执行计划。",
            numberOfItems: curated.length + community.length,
          }),
        }}
      />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: "蓝图库" }]} />

        {/* Hero */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">AI 项目蓝图库</h1>
          <p className="text-gray-600 text-lg max-w-2xl">
            {curated.length + community.length} 个即用蓝图，附完整执行计划、工具推荐和成本估算。选一个，马上开始构建。
          </p>
          <div className="mt-4 flex gap-3">
            <Link
              href="/zh/search"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              生成你的蓝图
            </Link>
            <a
              href="#community"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
            >
              社区蓝图 ({community.length})
            </a>
          </div>
        </div>

        {/* Sticky Category Tabs */}
        <CategoryTabs
          categories={categories.map((c) => ({
            name: categoryNameZh[c.slug] || c.name,
            slug: c.slug,
            icon: c.icon,
            count: c.blueprints.length,
          }))}
          hasCommunity={community.length > 0}
          communityCount={community.length}
        />

        {/* Curated Blueprints by Category */}
        {categories.map(({ name, slug: catSlug, icon: catIcon, blueprints }) => (
          <section key={catSlug} id={catSlug} className="mb-10 scroll-mt-24">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>{catIcon}</span>
              {categoryNameZh[catSlug] || name}
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
                社区蓝图
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">NEW</span>
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                由用户通过 AI 蓝图生成器创建。{" "}
                <Link href="/zh/search" className="text-blue-600 hover:underline">
                  创建你的蓝图
                </Link>
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
          <h2 className="font-semibold text-gray-700 mb-2">什么是 AI 项目蓝图？</h2>
          <p>
            AI 项目蓝图是一组精心策划的工具、框架和服务的组合，旨在解决特定问题。每个蓝图包含具体的执行计划、成本估算、风险因素和替代工具
            — 让你可以立即开始构建，而不是花数周时间研究该用哪些工具。
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
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${difficultyColors[bp.difficulty] ?? "bg-gray-100 text-gray-500"}`}
            >
              {difficultyLabels[bp.difficulty] || bp.difficulty}
            </span>
            <span className="text-[10px] text-gray-400">
              {layers.length} 层 · {toolCount} 个工具
            </span>
            {isCommunity && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                社区
              </span>
            )}
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-500 line-clamp-2 mb-2">{bp.description}</p>
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

  return CATEGORIES.filter((cat) => groups[cat.slug].length > 0).map((cat) => ({
    name: cat.name,
    slug: cat.slug,
    icon: cat.icon,
    blueprints: groups[cat.slug],
  }));
}
