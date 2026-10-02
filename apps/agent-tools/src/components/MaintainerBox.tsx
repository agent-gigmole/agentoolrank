"use client";

import { useState } from "react";
import { track } from "@/components/Analytics";

/** Shown on every tool page: maintainers can feature their tool or grab the README badge. */
export function MaintainerBox({ slug, name, paymentsEnabled }: { slug: string; name: string; paymentsEnabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const badge = `[![${name} on AgentoolRank](https://agentoolrank.com/api/badge/${slug})](https://agentoolrank.com/tool/${slug})`;
  const [copied, setCopied] = useState(false);

  async function feature() {
    setBusy(true);
    setErr("");
    track("checkout_click", `/tool/${slug}#featured`);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, plan: "featured", src: "tool-page" }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setErr(data.error ?? "Could not start checkout.");
    } catch {
      setErr("Network error, please try again.");
    }
    setBusy(false);
  }

  return (
    <section id="maintainers" className="mt-10 border border-gray-200 rounded-xl p-5 bg-gray-50 scroll-mt-20">
      <h2 className="font-semibold text-gray-900 mb-1">Maintain {name}?</h2>
      <p className="text-sm text-gray-600 mb-4">
        Show your live rank in your README, or put {name} in front of every visitor to AgentoolRank.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(badge).then(() => setCopied(true), () => {});
            track("badge_copy", `/tool/${slug}`);
          }}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:border-gray-500 bg-white"
        >
          {copied ? "Badge Markdown copied" : "Copy README badge"}
        </button>
        {paymentsEnabled && (
          <button
            type="button"
            onClick={feature}
            disabled={busy}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            Feature on the homepage · $49 / 7 days
          </button>
        )}
      </div>
      {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
    </section>
  );
}
