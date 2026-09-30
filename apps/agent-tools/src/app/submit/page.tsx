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
      <SubmitForm paymentsEnabled={Boolean(process.env.STRIPE_SECRET_KEY)} />
      <p className="text-xs text-gray-500 mt-6">
        We review every submission. We list tools for building, running or evaluating AI agents; unrelated products are declined.
      </p>
    </main>
  );
}
