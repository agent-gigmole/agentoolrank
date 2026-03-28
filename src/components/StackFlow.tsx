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

function ToolNode({ tool }: { tool: StackTool }) {
  const isPrimary = tool.role === "Primary";
  return (
    <Link
      href={`/tool/${tool.tool_id}`}
      className={`block p-2.5 rounded-lg border transition-all hover:shadow-md ${
        isPrimary
          ? "border-blue-300 bg-blue-50 hover:border-blue-400"
          : "border-gray-200 bg-white hover:border-gray-400"
      }`}
    >
      <div className="flex items-center gap-1.5">
        {isPrimary && (
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
        )}
        <span className={`text-sm font-medium ${isPrimary ? "text-blue-900" : "text-gray-700"}`}>
          {tool.name || tool.tool_id}
        </span>
        {tool.stars != null && (
          <span className="text-[10px] text-gray-400 ml-auto">{formatStars(tool.stars)}</span>
        )}
      </div>
      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{tool.note}</p>
    </Link>
  );
}

function Connector() {
  return (
    <div className="flex justify-center py-1">
      <div className="w-px h-6 bg-gray-300" />
      <svg className="absolute" width="12" height="8" viewBox="0 0 12 8" style={{ marginTop: 18 }}>
        <path d="M6 8L0 0h12z" fill="#d1d5db" />
      </svg>
    </div>
  );
}

export function StackFlow({ layers }: { layers: StackLayer[] }) {
  return (
    <div className="space-y-1">
      {layers.map((layer, idx) => (
        <div key={idx}>
          {idx > 0 && <Connector />}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            {/* Layer header */}
            <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-bold shrink-0">
                {idx + 1}
              </span>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{layer.name}</h3>
                <p className="text-[11px] text-gray-500">{layer.description}</p>
              </div>
            </div>

            {/* Tool nodes grid */}
            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {layer.tools.map((tool) => (
                <ToolNode key={tool.tool_id} tool={tool} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
