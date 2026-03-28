"use client";

import Link from "next/link";

interface StackTool {
  tool_id: string;
  role: string;
  note: string;
  name?: string;
  stars?: number | null;
  pricing?: string;
}

interface StackLayer {
  name: string;
  description: string;
  tools: StackTool[];
}

function formatStars(n: number | null | undefined): string {
  if (n == null) return "";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function pricingBadge(pricing?: string) {
  if (!pricing || pricing === "open-source") return null;
  const colors: Record<string, string> = {
    free: "bg-green-100 text-green-700",
    freemium: "bg-yellow-100 text-yellow-700",
    paid: "bg-red-100 text-red-700",
  };
  return (
    <span className={`text-[9px] px-1 py-0.5 rounded ${colors[pricing] || "bg-gray-100 text-gray-500"}`}>
      {pricing}
    </span>
  );
}

function ToolNode({ tool, delay }: { tool: StackTool; delay: number }) {
  const isPrimary = tool.role === "Primary";
  return (
    <Link
      href={`/tool/${tool.tool_id}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`block p-2.5 rounded-lg border transition-all hover:shadow-md animate-fade-in ${
        isPrimary
          ? "border-blue-300 bg-blue-50 hover:border-blue-400"
          : "border-gray-200 bg-white hover:border-gray-400"
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-1.5">
        {isPrimary && (
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
        )}
        <span className={`text-sm font-medium ${isPrimary ? "text-blue-900" : "text-gray-700"}`}>
          {tool.name || tool.tool_id}
        </span>
        <span className="ml-auto flex items-center gap-1">
          {pricingBadge(tool.pricing)}
          {tool.stars != null && (
            <span className="text-[10px] text-gray-400">{formatStars(tool.stars)}</span>
          )}
        </span>
      </div>
      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{tool.note}</p>
    </Link>
  );
}

function Connector({ delay }: { delay: number }) {
  return (
    <div
      className="flex flex-col items-center py-1 animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-px h-5 bg-gradient-to-b from-gray-300 to-gray-400" />
      <svg width="10" height="6" viewBox="0 0 10 6">
        <path d="M5 6L0 0h10z" fill="#9ca3af" />
      </svg>
    </div>
  );
}

export function StackFlow({ layers }: { layers: StackLayer[] }) {
  let globalDelay = 0;

  return (
    <>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          opacity: 0;
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
      <div className="space-y-1">
        {layers.map((layer, idx) => {
          const layerDelay = globalDelay;
          globalDelay += 100;

          return (
            <div key={idx}>
              {idx > 0 && <Connector delay={layerDelay - 50} />}
              <div
                className="border border-gray-200 rounded-xl overflow-hidden animate-fade-in"
                style={{ animationDelay: `${layerDelay}ms` }}
              >
                {/* Layer header */}
                <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900">{layer.name}</h3>
                    <p className="text-[11px] text-gray-500 truncate">{layer.description}</p>
                  </div>
                </div>

                {/* Tool nodes grid */}
                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {layer.tools.map((tool, toolIdx) => {
                    const toolDelay = layerDelay + 50 + toolIdx * 60;
                    globalDelay = Math.max(globalDelay, toolDelay + 60);
                    return (
                      <ToolNode key={tool.tool_id} tool={tool} delay={toolDelay} />
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
