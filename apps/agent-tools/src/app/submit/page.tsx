import { listingProductJsonLd } from "@/lib/plans";
import type { Metadata } from "next";
import { getToolCount } from "@repo/db/queries";
import { SubmitForm } from "./SubmitForm";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Submit Your AI Agent Tool — Free Listing",
  description:
    "List your AI agent, framework or dev tool on AgentoolRank for free. Get a permanent page with live GitHub stats, comparisons with alternatives, and a badge for your README.",
  alternates: { canonical: "/submit" },
};

export default async function SubmitPage() {
  const toolCount = await getToolCount();
  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listingProductJsonLd(process.env.NEXT_PUBLIC_BASE_URL || "https://agentoolrank.com")) }} />
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit your AI agent tool</h1>
      <p className="text-gray-600 mb-6">
        Join {toolCount}+ tools ranked by real GitHub activity. Listing is free.
      </p>
      <ul className="text-sm text-gray-700 space-y-1.5 mb-8">
        <li>✓ A permanent page with live GitHub stars, growth and release activity</li>
        <li>✓ Automatic &ldquo;alternatives&rdquo; and &ldquo;X vs Y&rdquo; comparison pages that people search for</li>
        <li>✓ Listed in our <code>llms.txt</code>, so AI assistants can find and recommend you</li>
        <li>✓ A badge for your site and README</li>
      </ul>
      <p className="text-sm text-gray-600 mb-6">
        Already listed? Paste its GitHub link below and submit: you&apos;ll get the badge and can feature it on the homepage and its category page.
      </p>
      <SubmitForm paymentsEnabled={Boolean(process.env.STRIPE_SECRET_KEY)} />
      <section id="what-we-list" className="mt-8 text-sm text-gray-700">
        <h2 className="text-base font-semibold text-gray-900 mb-2">What we list</h2>
        <p className="mb-2">
          <strong>Yes:</strong> tools for building, running, hosting or evaluating AI agents (frameworks, memory and RAG, MCP servers,
          sandboxes, observability and evals, protocols), and agents that act on their own (coding, browser, research and voice agents).
        </p>
        <p className="mb-2">
          <strong>No:</strong> general chat clients, single-purpose AI apps (translation, transcription, note-taking, vertical consumer apps),
          models and model-training or fine-tuning libraries, courses, paper lists and prompt collections, and projects that are archived or whose site no longer works.
        </p>
        <p className="text-xs text-gray-500">
          Every listed tool is re-checked against these rules from its own README and website; tools that no longer fit are unlisted.
          Comparing options? See <a href="/where-to-list" className="underline">where to list an AI agent tool</a> (free vs paid directories).
        </p>
      </section>
    </main>
  );
}
