import { AISearch } from "@/components/AISearch";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Marketing Blueprint Generator — Build Your Marketing Stack",
  description:
    "Describe your marketing goals and get an AI-recommended tool stack. Powered by data from 200+ AI marketing tools.",
  alternates: {
    canonical: (process.env.NEXT_PUBLIC_BASE_URL || "https://aimarketrank.com") + "/search",
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
          AI Marketing Blueprint Generator
        </h1>
        <p className="text-gray-500 text-sm">
          Describe your marketing goals — our AI advisor will recommend the right
          tool stack. You can iterate by asking follow-up questions.
        </p>
      </div>

      <AISearch initialQuery={query || undefined} />
    </main>
  );
}
