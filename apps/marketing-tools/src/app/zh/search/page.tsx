import { AISearch } from "@/components/AISearch";
import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI 营销工具推荐 — 智能选型助手 | AIMarketRank",
  description: "描述你的营销需求，AI 帮你推荐最佳工具组合。支持 SEO、邮件、社交、内容、CRM、广告等场景。",
};

export default async function ZhSearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          AI 营销工具推荐
        </h1>
        <p className="text-sm text-gray-500">
          描述你的营销需求，AI 帮你推荐最佳工具组合和执行方案
        </p>
      </div>

      <Suspense fallback={<div className="text-center py-12 text-gray-400">加载中...</div>}>
        <AISearch initialQuery={q} locale="zh" />
      </Suspense>
    </main>
  );
}
