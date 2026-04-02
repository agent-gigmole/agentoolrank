"use client";

import { usePathname } from "next/navigation";

export function RootFooter() {
  const pathname = usePathname();
  const isZh = pathname.startsWith("/zh");

  return (
    <footer className="border-t border-gray-200 py-6 mt-12">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
        <span>
          {isZh
            ? "AgenTool Rank — 数据驱动的 AI Agent 工具目录"
            : "AgenTool Rank — Data-driven AI agent tools directory"}
        </span>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/agent-gigmole/awesome-ai-agent-tools"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-600 transition-colors"
          >
            {isZh ? "开源数据集" : "Open Source Dataset"}
          </a>
          <a
            href="https://github.com/agent-gigmole/agentoolrank"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-600 transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
