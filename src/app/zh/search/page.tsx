import { AISearch } from "@/components/AISearch";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI 工具栈构建器 — 你想构建什么？ | AgenToolRank",
  description:
    "描述你的项目，AI 为你推荐工具栈并生成流程图。基于 463+ AI Agent 工具的数据驱动推荐。",
  alternates: {
    canonical: "https://agentoolrank.com/zh/search",
    languages: { en: "https://agentoolrank.com/search" },
  },
};

type Props = { searchParams: Promise<{ q?: string }> };

export default async function ZhSearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">你想构建什么？</h1>
        <p className="text-gray-500 text-sm">
          描述你的项目 — AI 架构师会为你推荐合适的工具栈。你可以通过追问来迭代优化。
        </p>
      </div>

      <AISearch initialQuery={query || undefined} locale="zh" />
    </main>
  );
}
