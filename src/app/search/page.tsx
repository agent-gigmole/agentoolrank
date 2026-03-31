import { AISearch } from "@/components/AISearch";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Tool Stack Builder — What do you want to build?",
  description:
    "Describe your project and get an AI-recommended tool stack with flow diagram. Powered by data from 463+ AI agent tools.",
  alternates: {
    canonical: "https://agentoolrank.com/search",
    languages: { zh: "https://agentoolrank.com/zh/search" },
  },
};

type Props = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          What do you want to build?
        </h1>
        <p className="text-gray-500 text-sm">
          Describe your project — our AI architect will recommend the right tool
          stack. You can iterate by asking follow-up questions.
        </p>
      </div>

      <AISearch initialQuery={query || undefined} />
    </main>
  );
}
