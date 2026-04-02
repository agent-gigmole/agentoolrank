import Link from "next/link";
import type { Tool } from "@repo/db/schema";

function formatStars(stars: number | null): string {
  if (stars === null) return "N/A";
  if (stars >= 1000) return `${(stars / 1000).toFixed(1)}k`;
  return String(stars);
}

function VelocityBadge({ velocity }: { velocity: number | null }) {
  if (velocity === null) return null;
  const isPositive = velocity > 0;
  return (
    <span className={`text-xs font-medium ${isPositive ? "text-green-600" : "text-gray-400"}`}>
      {isPositive ? "↑" : "→"} {Math.abs(velocity).toFixed(0)}/mo
    </span>
  );
}

function PricingBadge({ pricing }: { pricing: string }) {
  const colors: Record<string, string> = {
    "open-source": "bg-green-100 text-green-800",
    free: "bg-blue-100 text-blue-800",
    freemium: "bg-yellow-100 text-yellow-800",
    paid: "bg-purple-100 text-purple-800",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${colors[pricing] ?? "bg-gray-100 text-gray-600"}`}>
      {pricing}
    </span>
  );
}

export function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link
      href={`/tool/${tool.id}`}
      className="block p-4 border border-gray-200 rounded-lg hover:border-gray-400 hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-3">
        {tool.logo_url ? (
          <img src={tool.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-lg font-bold text-gray-400">
            {tool.name.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 truncate">{tool.name}</h3>
            <PricingBadge pricing={tool.pricing} />
          </div>
          <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{tool.tagline}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            {tool.github_stars !== null && (
              <span className="flex items-center gap-1">
                ⭐ {formatStars(tool.github_stars)}
                <VelocityBadge velocity={tool.star_velocity_30d} />
              </span>
            )}
            {tool.category_tags.length > 0 && (
              <span className="text-gray-400">{tool.category_tags[0]}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ToolCardSkeleton() {
  return (
    <div className="p-4 border border-gray-200 rounded-lg animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-gray-200" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    </div>
  );
}
