import type { Metadata } from "next";
import Link from "next/link";
import { KIT_PRICE_USD } from "@/lib/directory-kit";
import { DIRECTORIES, CHECKED } from "@/lib/directories";
import { FaqSection } from "@/components/FaqSection";
import { TestedDirectoryTable } from "@/components/TestedDirectoryTable";
import { summarize, type TestedDirectory } from "@/lib/tested-directories";
import tested from "@/lib/directories-tested.json";

const TESTED = tested as TestedDirectory[];
const S = summarize(TESTED);

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Where to List Your AI Agent Tool: Free vs Paid Directories Compared",
  description: `Free and paid options for listing an AI agent tool or MCP server — PeerPush, AI Agents List, mcp.so, mcpservers.org, the MCP Registry and AgentoolRank. Prices checked ${CHECKED}.`,
  alternates: { canonical: "/where-to-list" },
};

const faq = [
  { q: "Where can I list an AI agent tool for free?", a: "PeerPush (free queue), mcpservers.org (free, up to 2 weeks for MCP servers), the official MCP Registry (free, MCP servers) and AgentoolRank (free queue) all accept free listings." },
  { q: "Is paying for a faster listing worth it?", a: "Only if launch timing matters to you. Paid tiers mostly buy speed, placement or a dofollow link; the listing itself is usually available for free if you can wait." },
  { q: "Where should I list an MCP server?", a: "Start with the official MCP Registry, which other MCP directories read from, then mcpservers.org (free). mcp.so's web form is paid ($39); a free GitHub-issue route also exists." },
];

export default function WhereToListPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-3">Where to list your AI agent tool: free vs paid directories</h1>
      <p className="text-gray-700 mb-2">
        <b>Short answer:</b> you can get listed for free almost everywhere if you can wait — paid tiers buy speed, placement or a dofollow link.
        For MCP servers, publish to the official MCP Registry first.
      </p>
      <p className="text-sm text-gray-500 mb-8">
        Disclosure: this page is written by AgentoolRank, one of the directories below. Prices and review times were checked by hand on each
        submit page on {CHECKED}; they change, so follow the links before you decide.
      </p>

      <div className="overflow-x-auto border border-gray-200 rounded-lg mb-10">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left p-3">Directory</th>
              <th className="text-left p-3">Free option</th>
              <th className="text-left p-3">Paid options</th>
              <th className="text-left p-3">Review time</th>
              <th className="text-left p-3">Notes</th>
            </tr>
          </thead>
          <tbody>
            {DIRECTORIES.map((d) => (
              <tr key={d.name} className={`border-t align-top ${d.self ? "bg-blue-50" : ""}`}>
                <td className="p-3 font-medium">
                  <a href={d.url} className="hover:underline" rel={d.self ? undefined : "nofollow noopener"} target={d.self ? undefined : "_blank"}>{d.name}</a>
                </td>
                <td className="p-3">{d.free}</td>
                <td className="p-3">{d.paid}</td>
                <td className="p-3">{d.review}</td>
                <td className="p-3 text-gray-600">{d.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{S.total} directories we actually submitted to</h2>
        <p className="text-gray-700 mb-2">
          Beyond the AI-agent directories above, these are the general startup, SaaS and AI directories our own products went through
          (2026-09-29 to 2026-10-02). {S.free} had a free option, but {S.badgeOrBacklink} wanted a badge or backlink in return, and {S.needsHuman} had
          a captcha or another step only a person can do. We checked the live link on {S.linkChecked} of them; {S.nofollowOfChecked} were not dofollow
          (we mostly checked when something looked off, so treat that as a warning, not a rate).
        </p>
        <p className="text-xs text-gray-500 mb-4">Facts come from our own submission notes, not from third-party lists. Rules change; if one is out of date, email hello@agentoolrank.com.</p>
        <TestedDirectoryTable rows={TESTED} />
        <div className="mt-4 border border-blue-200 rounded-xl p-5 bg-blue-50">
          <p className="font-semibold text-gray-900 mb-1">Which of these fit your product, and what trips the form?</p>
          <p className="text-sm text-gray-700 mb-2">
            The Submit Kit ranks these directories for your product type and adds what the table leaves out: the form gotchas we hit on each site,
            how to tell a submission went through, the steps only a person can do, and a &quot;don&apos;t submit here&quot; list with reasons.
            Your AI assistant can call it over MCP. The top 10 are free; the full 30 plus the avoid list is a one-time ${KIT_PRICE_USD}.
            No traffic or ranking is promised.
          </p>
          <p className="text-sm">
            Free top 10 for your product:{" "}
            {[["ai_tool", "AI tool"], ["mcp_server", "MCP server"], ["dev_tool", "Developer tool"], ["saas", "SaaS"]].map(([id, label], i) => (
              <span key={id}>
                {i > 0 && " · "}
                <Link href={`/submit-kit?type=${id}`} data-testid={`wtl-kit-${id}`} className="text-blue-600 hover:underline">{label}</Link>
              </span>
            ))}
            {" · "}
            <Link href="/submit-kit" className="text-blue-600 hover:underline">See the Submit Kit →</Link>
          </p>
        </div>
      </section>

      <section className="space-y-3 text-gray-700 mb-10">
        <h2 className="text-xl font-semibold text-gray-900">Which one should you pick?</h2>
        <p><b>Want the biggest audience?</b> PeerPush has an established builder community and daily/weekly awards; it is a general product directory, so agent tools compete with everything else.</p>
        <p><b>Shipping an MCP server?</b> Publish to the official MCP Registry, then submit to mcpservers.org — both are free and MCP-specific.</p>
        <p><b>Building an open-source agent framework, coding agent or eval tool?</b> AgentoolRank lists only agent tools and shows live GitHub activity, alternatives and head-to-head comparisons, and AI assistants can query it over MCP. It is new, so its own traffic is still small — weigh that honestly against the bigger directories.</p>
      </section>

      <FaqSection faq={faq} />

      <div className="mt-10 border rounded-xl p-6 bg-gray-50">
        <p className="font-semibold mb-1">List your agent tool on AgentoolRank</p>
        <p className="text-sm text-gray-600 mb-3">Free queue, or $9–$49 to skip it. Agents can submit via our MCP server or API.</p>
        <div className="flex gap-4 text-sm">
          <Link href="/submit" className="text-blue-600 hover:underline">Submit for free →</Link>
          <Link href="/agents" className="text-blue-600 hover:underline">Submit via MCP / API →</Link>
        </div>
      </div>
    </main>
  );
}
