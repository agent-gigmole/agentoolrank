import Link from "next/link";
import { getCategories, getTools, getToolCount, getLastRefreshTime } from "@/lib/queries";
import { ToolCard } from "@/components/ToolCard";
import { NewsletterForm } from "@/components/NewsletterForm";

export const revalidate = 43200;

const categoryNames: Record<string, string> = {
  "ai-content-marketing": "AI 内容创作",
  "ai-seo": "AI SEO 工具",
  "ai-email-marketing": "AI 邮件营销",
  "ai-social-media": "AI 社交媒体",
  "ai-crm-sales": "AI CRM 与销售",
  "ai-ads-optimization": "AI 广告投放",
  "ai-analytics": "AI 营销分析",
};

export default async function ZhHomePage() {
  const [categories, trendingTools, toolCount, lastRefresh] = await Promise.all([
    getCategories(),
    getTools({ sort: "velocity", limit: 12 }),
    getToolCount(),
    getLastRefreshTime(),
  ]);

  const refreshAgo = lastRefresh ? getTimeAgo(new Date(lastRefresh)) : null;

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero */}
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          AI 营销工具导航
        </h1>
        <p className="text-lg text-gray-600 mb-1">
          对比 {toolCount}+ 个 AI 营销工具，找到最适合你业务的工具组合
        </p>
        <p className="text-sm text-gray-400 mb-6">
          涵盖 SEO · 邮件营销 · 社交媒体 · 内容创作 · CRM · 广告投放 · 数据分析
        </p>

        {/* Search Box */}
        <div className="max-w-2xl mx-auto">
          <form action="/zh/search" method="GET">
            <div className="relative">
              <input
                type="text"
                name="q"
                placeholder="描述你的营销需求……例如：SEO 工具推荐、邮件自动化、社交媒体管理"
                className="w-full px-5 py-4 pr-20 border border-gray-300 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                AI 推荐
              </button>
            </div>
          </form>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {["SEO 工具对比", "邮件营销自动化", "AI 文案生成", "社交媒体排期", "CRM 选型", "广告投放优化"].map((q) => (
              <a
                key={q}
                href={`/zh/search?q=${encodeURIComponent(q)}`}
                className="text-xs px-3 py-1 border border-gray-200 rounded-full hover:border-green-300 hover:bg-green-50/50 text-gray-500 hover:text-green-600 transition-colors"
              >
                {q}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">按分类浏览</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all"
            >
              <span className="text-xl">{cat.icon}</span>
              <div>
                <div className="font-medium text-sm text-gray-900">{categoryNames[cat.slug] || cat.name}</div>
                {cat.tool_count > 0 && (
                  <div className="text-xs text-gray-400">{cat.tool_count} 个工具</div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending */}
      {trendingTools.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">热门工具</h2>
            <span className="text-xs text-gray-400">按增长速度排名</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {trendingTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      )}

      {/* Newsletter */}
      <NewsletterForm />

      {/* SEO Footer */}
      <section className="mt-12 pt-8 border-t border-gray-100 text-sm text-gray-500 max-w-2xl">
        <h2 className="font-semibold text-gray-700 mb-2">什么是 AI 营销工具导航？</h2>
        <p>
          AIMarketRank 是一个数据驱动的 AI 营销工具目录，帮助营销人员、创业者和 Agency
          快速找到最适合的工具组合。我们追踪每个工具的真实数据（GitHub 活跃度、定价、集成能力），
          并提供 AI 驱动的工具栈推荐，让你不再花时间逐个对比，直接获得专业建议。
        </p>
      </section>
    </main>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "刚刚";
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
}
