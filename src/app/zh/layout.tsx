import type { Metadata } from "next";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "AgenTool Rank — 数据驱动的 AI Agent 工具目录",
  description:
    "463 个 AI Agent 工具，按 GitHub 活跃度排名，每日更新。描述你想构建的项目，AI 为你生成完整的技术蓝图。",
  alternates: {
    canonical: "https://agentoolrank.com/zh",
    languages: { en: "https://agentoolrank.com" },
  },
};

export default function ZhLayout({ children }: { children: React.ReactNode }) {
  return (
    <div lang="zh">
      <Nav locale="zh" />
      {children}
    </div>
  );
}
