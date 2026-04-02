import Link from "next/link";
import { getCategories, getTools, getToolCount, getLastRefreshTime } from "@repo/db/queries";
import { ToolCard } from "@/components/ToolCard";
import { NewsletterForm } from "@/components/NewsletterForm";
import type { Metadata } from "next";

export const revalidate = 43200; // 12 hours

const categoryNameZh: Record<string, string> = {
  "agent-frameworks": "Agent 框架",
  "coding-agents": "编程 Agent",
  "no-code-agent-builders": "无代码 Agent 构建器",
  "observability-evaluation": "可观测性与评估",
  "memory-knowledge": "记忆与知识库",
  "tool-integration": "工具集成",
  "browser-web-agents": "浏览器 Agent",
  "agent-protocols": "Agent 协议",
  "enterprise-agent-platforms": "企业 Agent 平台",
  "voice-agents": "语音 Agent",
  "sandboxes-execution": "沙箱与执行环境",
};

export const metadata: Metadata = {
  title: "AgenTool Rank — 数据驱动的 AI Agent 工具目录",
  description:
    "463 个 AI Agent 工具，按 GitHub 活跃度排名，每日更新。描述你想构建的项目，AI 为你生成完整的技术蓝图。",
  alternates: {
    canonical: "https://agentoolrank.com/zh",
    languages: { en: "https://agentoolrank.com" },
  },
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
      {/* Hero — AI Search */}
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">AgenTool Rank</h1>
        <p className="text-lg text-gray-600 mb-1">
          描述你想构建什么，AI 为你推荐工具栈。
        </p>
        {toolCount > 0 && (
          <p className="text-sm text-gray-400 mb-6">
            {toolCount} 个工具 · {refreshAgo ? `${refreshAgo}更新` : "每日更新"}
          </p>
        )}

        {/* AI Search Box */}
        <div className="max-w-2xl mx-auto">
          <form action="/zh/search" method="GET">
            <div className="relative">
              <input
                type="text"
                name="q"
                placeholder="例如：RAG 聊天机器人 / 金融量化系统 / AI 代码审查..."
                className="w-full px-5 py-4 pr-24 border border-gray-300 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                AI 推荐
              </button>
            </div>
          </form>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {["RAG 聊天机器人", "代码审查", "量化交易", "客服机器人", "多 Agent 协作"].map((q) => (
              <a
                key={q}
                href={`/zh/search?q=${encodeURIComponent(q)}`}
                className="text-xs px-3 py-1 border border-gray-200 rounded-full hover:border-blue-300 hover:bg-blue-50/50 text-gray-500 hover:text-blue-600 transition-colors"
              >
                {q}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Grid */}
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
                <div className="font-medium text-sm text-gray-900">
                  {categoryNameZh[cat.slug] || cat.name}
                </div>
                {cat.tool_count > 0 && (
                  <div className="text-xs text-gray-400">{cat.tool_count} 个工具</div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending Tools */}
      {trendingTools.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">热门工具</h2>
            <span className="text-xs text-gray-400">按 Star 增速排名</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {trendingTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      )}

      {/* Open Source Dataset */}
      <section className="mb-12 flex items-center justify-between p-4 border border-gray-200 rounded-lg">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">开源数据集</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            全部 {toolCount} 个工具的 JSON/CSV 数据 — 免费使用，每日更新。
          </p>
        </div>
        <a
          href="https://github.com/agent-gigmole/awesome-ai-agent-tools"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium whitespace-nowrap"
        >
          在 GitHub 查看
        </a>
      </section>

      {/* Newsletter CTA */}
      <NewsletterForm />
    </main>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "刚刚";
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
}
