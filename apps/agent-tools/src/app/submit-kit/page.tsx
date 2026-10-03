import type { Metadata } from "next";
import Link from "next/link";
import { KIT_PRICE_USD } from "@/lib/directory-kit";

export const metadata: Metadata = {
  title: "Submit Kit: which launch directories to submit to, and which to skip",
  description: `For your agent: recommend_directories returns launch directories we actually submitted to, tagged auto or manual, with free-tier conditions, measured link type, form tips and the steps only a person can do. Free top 10; full list $${KIT_PRICE_USD} one-time.`,
  alternates: { canonical: "/submit-kit" },
};

export default function SubmitKitPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-10 text-gray-800">
      <h1 className="text-3xl font-bold text-gray-900 mb-3">Submit Kit: submit to fewer directories, the right ones</h1>
      <p className="mb-4">
        A tool for your own agent. Call <code>recommend_directories</code> on our MCP server with your product type and it returns launch
        directories our own products actually went through: each one tagged <b>auto</b> (your agent can finish it) or <b>manual</b> (needs
        one human step), with the free-tier conditions, the link type we measured on a live listing, login method, form tips and the
        confirmation to look for. All human-only steps (inbox links, captchas, real names) come back as one checklist, so you do them in one sitting.
      </p>
      <ul className="list-disc pl-5 space-y-1 mb-6 text-sm">
        <li><b>Free:</b> the top 10 for your product type, right now, no signup.</li>
        <li><b>Full, ${KIT_PRICE_USD} one-time:</b> 30 sites plus the &ldquo;don&rsquo;t submit&rdquo; list with reasons (paid-only, badge-for-link, vote-for-others, broken forms, auto-reject of new domains), updated for 30 days. Payments open on 2026-10-04.</li>
        <li><b>Not included:</b> automated submission, captcha solving, or any promise of traffic, rankings or dofollow links.</li>
      </ul>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Use it</h2>
      <pre className="bg-gray-50 border rounded-lg p-3 text-xs overflow-x-auto mb-4">{`{ "mcpServers": { "agentoolrank": { "url": "https://agentoolrank.com/api/mcp" } } }

recommend_directories({ "product_type": "ai_tool" })   // ai_tool | mcp_server | dev_tool | saas | other`}</pre>
      <p className="text-sm text-gray-600">
        The free comparison table is at <Link href="/where-to-list" className="underline">/where-to-list</Link>. Facts come from our own
        submissions and carry a last-verified date; entries older than 30 days are marked stale. Questions: hello@agentoolrank.com.
      </p>
    </main>
  );
}
