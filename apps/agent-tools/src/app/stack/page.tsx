import Link from "next/link";
import { getStacks } from "@repo/db/queries";
import { Breadcrumbs, BreadcrumbJsonLd } from "@repo/ui/Breadcrumbs";
import type { Metadata } from "next";

export const revalidate = 43200;

export const metadata: Metadata = {
  title: "AI Agent Tool Stacks — Pick the Right Tools for Every Task",
  description:
    "Pre-built tool combinations for common AI agent tasks. See exactly which frameworks, databases, and services you need to build RAG chatbots, coding assistants, multi-agent systems, and more.",
};

const difficultyColors: Record<string, string> = {
  beginner: "bg-green-100 text-green-700",
  intermediate: "bg-yellow-100 text-yellow-700",
  advanced: "bg-red-100 text-red-700",
};

export default async function StackIndexPage() {
  const stacks = await getStacks();

  return (
    <>
      <BreadcrumbJsonLd items={[{ label: "Tool Stacks" }]} />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: "Tool Stacks" }]} />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI Agent Tool Stacks
          </h1>
          <p className="text-gray-600">
            Pre-built tool combinations for {stacks.length} common tasks.
            Pick a scenario and see exactly which tools you need.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stacks.map((stack) => {
            const toolCount = stack.layers.reduce((s, l) => s + l.tools.length, 0);
            return (
              <Link
                key={stack.slug}
                href={`/stack/${stack.slug}`}
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start gap-3 mb-2">
                  <span className="text-2xl">{stack.icon}</span>
                  <div className="min-w-0">
                    <h2 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm leading-tight">
                      {stack.title}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${difficultyColors[stack.difficulty] ?? ""}`}>
                        {stack.difficulty}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {stack.layers.length} layers · {toolCount} tools
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">
                  {stack.description}
                </p>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
