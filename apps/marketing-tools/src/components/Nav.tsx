import Link from "next/link";
import type { Locale } from "@/i18n/types";

export function Nav({ locale = "en" }: { locale?: Locale }) {
  const isZh = locale === "zh";
  const prefix = isZh ? "/zh" : "";

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href={`${prefix}/`} className="font-bold text-gray-900 text-lg">
          AIMarketRank
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href={`${prefix}/blueprint`} className="text-gray-600 hover:text-gray-900 transition-colors">
            {isZh ? "蓝图库" : "Blueprints"}
          </Link>
          <Link href="/compare" className="text-gray-600 hover:text-gray-900 transition-colors">
            {isZh ? "对比" : "Compare"}
          </Link>
          <Link href="/weekly" className="text-gray-600 hover:text-gray-900 transition-colors hidden sm:inline">
            {isZh ? "周报" : "Weekly"}
          </Link>
          <Link
            href={`${prefix}/search`}
            className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            {isZh ? "AI 推荐" : "AI Advisor"}
          </Link>
          {/* Language switcher */}
          <Link
            href={isZh ? "/" : "/zh"}
            className="text-gray-400 hover:text-gray-600 text-xs transition-colors"
          >
            {isZh ? "EN" : "中文"}
          </Link>
        </div>
      </div>
    </nav>
  );
}
