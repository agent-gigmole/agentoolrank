import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI 营销工具导航 — 找到最适合你的 AI 营销工具 | AIMarketRank",
  description: "对比 50+ 个 AI 营销工具，涵盖 SEO、邮件营销、社交媒体、内容创作、CRM。数据驱动，帮你选对工具。",
};

export default function ZhLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
