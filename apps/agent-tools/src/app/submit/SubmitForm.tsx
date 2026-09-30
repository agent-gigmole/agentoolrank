"use client";

import { useState } from "react";
import { badgeHtml } from "@/lib/submissions";

type Result =
  | { kind: "queued"; slug: string; position: number; waitDays: number; name: string }
  | { kind: "listed"; slug: string };

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://agentoolrank.com";

export function SubmitForm() {
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    const form = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    let src = "";
    try {
      src = sessionStorage.getItem("utm_src") ?? document.referrer ?? "";
    } catch {}
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, src }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else if (data.alreadyListed) {
        setResult({ kind: "listed", slug: data.slug });
      } else {
        setResult({ kind: "queued", slug: data.slug, position: data.position, waitDays: data.waitDays, name: form.name });
      }
    } catch {
      setError("Network error, please try again.");
    }
    setStatus("idle");
  }

  if (result?.kind === "listed") {
    return (
      <div className="bg-blue-50 rounded-xl p-6">
        <p className="font-medium text-blue-900">Good news: this tool is already listed.</p>
        <a href={`/tool/${result.slug}`} className="text-blue-700 underline">See its page →</a>
      </div>
    );
  }

  if (result?.kind === "queued") {
    const snippet = badgeHtml(BASE_URL, result.slug, result.name);
    return (
      <div className="space-y-6">
        <div className="bg-green-50 rounded-xl p-6">
          <p className="text-green-800 font-semibold text-lg">You&apos;re in the queue: #{result.position}</p>
          <p className="text-green-700 text-sm mt-1">
            Estimated review in about {result.waitDays} day{result.waitDays === 1 ? "" : "s"}. We&apos;ll email you when your page is live.
          </p>
        </div>
        <div className="border border-gray-200 rounded-xl p-6">
          <p className="font-semibold text-gray-900">Get reviewed first: add the badge</p>
          <p className="text-sm text-gray-600 mt-1 mb-3">
            Submissions whose website shows the AgentoolRank badge are reviewed before everyone else, and the badge shows live GitHub stars.
          </p>
          <pre className="bg-gray-50 text-xs p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-all">{snippet}</pre>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(snippet).then(() => setCopied(true), () => {});
            }}
            className="mt-3 px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700"
          >
            {copied ? "Copied" : "Copy badge HTML"}
          </button>
        </div>
      </div>
    );
  }

  const input = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Website *</span>
        <input name="url" type="url" required placeholder="https://yourtool.com" className={input} />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Tool name *</span>
        <input name="name" required maxLength={80} className={input} />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Tagline *</span>
        <input name="tagline" required maxLength={160} placeholder="What does it do, in one sentence?" className={input} />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">GitHub repo (if open source)</span>
        <input name="github_url" type="url" placeholder="https://github.com/owner/repo" className={input} />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Your email *</span>
        <input name="email" type="email" required className={input} />
        <span className="text-xs text-gray-500">Only used to tell you when your page is live. Never shown publicly.</span>
      </label>
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60"
      >
        {status === "loading" ? "Submitting…" : "Submit for free"}
      </button>
    </form>
  );
}
