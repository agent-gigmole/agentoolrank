"use client";

import { useState } from "react";
import { badgeHtml } from "@/lib/submissions";
import { track } from "@/components/Analytics";

type Result =
  | { kind: "queued"; slug: string; position: number; waitDays: number; name: string }
  | { kind: "listed"; slug: string; name: string };

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://agentoolrank.com";

function PaidOptions({ slug, waitDays, listed = false }: { slug: string; waitDays?: number; listed?: boolean }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");
  async function buy(plan: "priority" | "fast" | "featured") {
    setBusy(plan);
    setErr("");
    track("checkout_click", `/submit${listed ? "-listed" : ""}#${plan}`);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, plan }),
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
    setBusy(null);
  }
  return (
    <div className="border border-gray-200 rounded-xl p-6">
      <p className="font-semibold text-gray-900 mb-3">
        {listed ? "Want more developers to see it?" : <>Don&apos;t want to wait{waitDays && waitDays > 3 ? ` about ${waitDays} days` : ""}?</>}
      </p>
      {listed ? (
        <button type="button" onClick={() => buy("featured")} disabled={busy !== null}
          className="w-full text-left border-2 border-blue-500 rounded-lg p-4 hover:bg-blue-50 disabled:opacity-60">
          <div className="font-semibold">Feature it · $49</div>
          <div className="text-sm text-gray-600">7 days at the top of the homepage and its category page.</div>
        </button>
      ) : (
      <div className="grid sm:grid-cols-3 gap-3">
        <button type="button" onClick={() => buy("priority")} disabled={busy !== null}
          className="text-left border border-gray-300 rounded-lg p-4 hover:border-blue-500 disabled:opacity-60">
          <div className="font-semibold">Priority · $9</div>
          <div className="text-sm text-gray-600">Reviewed within 72 hours.</div>
        </button>
        <button type="button" onClick={() => buy("fast")} disabled={busy !== null}
          className="text-left border border-gray-300 rounded-lg p-4 hover:border-blue-500 disabled:opacity-60">
          <div className="font-semibold">Fast-track review · $19</div>
          <div className="text-sm text-gray-600">Reviewed within 24 hours.</div>
        </button>
        <button type="button" onClick={() => buy("featured")} disabled={busy !== null}
          className="text-left border-2 border-blue-500 rounded-lg p-4 hover:bg-blue-50 disabled:opacity-60">
          <div className="font-semibold">Featured · $49</div>
          <div className="text-sm text-gray-600">Fast-track + 7 days featured on the homepage and your category page.</div>
        </button>
      </div>
      )}
      <p className="text-xs text-gray-500 mt-3">One-time payment.{listed ? "" : " Not approved in review? Full refund."}</p>
      {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
    </div>
  );
}

function KitBox() {
  return (
    <div className="border border-gray-200 rounded-xl p-6">
      <p className="font-semibold text-gray-900">Listing it on other directories too?</p>
      <p className="text-sm text-gray-600 mt-1 mb-3">
        We tested 101 directories by submitting our own products. The Submit Kit tells you which ones fit this tool, the form gotchas on each,
        and which to skip. Top 10 free; full list $29 one-time.
      </p>
      <a href="/submit-kit" onClick={() => track("kit_click")} className="text-sm text-blue-600 hover:underline">See the Submit Kit →</a>
    </div>
  );
}

function BadgeBox({ slug, snippet, copied, onCopy, title, text }: { slug: string; snippet: string; copied: boolean; onCopy: () => void; title: string; text: string }) {
  return (
    <div className="border border-gray-200 rounded-xl p-6">
      <p className="font-semibold text-gray-900">{title}</p>
      <p className="text-sm text-gray-600 mt-1 mb-3">{text}</p>
      {/* eslint-disable-next-line @next/next/no-img-element -- live badge image, same URL as the snippet */}
      <img src={`/api/badge/${slug}`} alt="AgentoolRank badge preview" height={32} className="h-8 w-auto mb-3" />
      <pre className="bg-gray-50 text-xs p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-all">{snippet}</pre>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(snippet).then(onCopy, () => {});
          track("badge_copy");
        }}
        className="mt-3 px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700"
      >
        {copied ? "Copied" : "Copy badge HTML"}
      </button>
    </div>
  );
}

export function SubmitForm({ paymentsEnabled = false }: { paymentsEnabled?: boolean }) {
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);
  const [prefilled, setPrefilled] = useState("");

  // Paste a GitHub link → fill name / tagline / website from the repo, only into fields that are still empty.
  async function prefill(e: React.FocusEvent<HTMLInputElement>) {
    const form = e.currentTarget.form;
    const gh = e.currentTarget.value.trim();
    if (!form || !/github\.com\/[^/]+\/[^/]+/i.test(gh)) return;
    try {
      const res = await fetch(`/api/prefill?url=${encodeURIComponent(gh)}`);
      const data = (await res.json()) as Partial<Record<"name" | "tagline" | "url", string>>;
      const filled: string[] = [];
      for (const k of ["url", "name", "tagline"] as const) {
        const el = form.elements.namedItem(k) as HTMLInputElement | null;
        if (el && !el.value.trim() && data[k]) {
          el.value = data[k];
          filled.push(k === "url" ? "website" : k);
        }
      }
      if (filled.length) {
        setPrefilled(`Filled ${filled.join(", ")} from GitHub. Edit anything you like.`);
        track("prefill", undefined, { label: filled.join(",") });
      }
    } catch {}
  }

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
        setResult({ kind: "listed", slug: data.slug, name: form.name });
      } else {
        setResult({ kind: "queued", slug: data.slug, position: data.position, waitDays: data.waitDays, name: form.name });
        track("submit_done");
      }
    } catch {
      setError("Network error, please try again.");
    }
    setStatus("idle");
  }

  if (result?.kind === "listed") {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 rounded-xl p-6">
          <p className="font-medium text-blue-900">Good news: this tool is already listed.</p>
          <a href={`/tool/${result.slug}`} className="text-blue-700 underline">See its page →</a>
        </div>
        {paymentsEnabled && <PaidOptions slug={result.slug} listed />}
        <BadgeBox slug={result.slug} snippet={badgeHtml(BASE_URL, result.slug, result.name)} copied={copied} onCopy={() => setCopied(true)}
          title="Maintain it? Add the badge"
          text="Show live GitHub stars on your README or website. It links back to the tool's ranking page." />
        <KitBox />
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
        {paymentsEnabled && <PaidOptions slug={result.slug} waitDays={result.waitDays} />}
        <BadgeBox slug={result.slug} snippet={snippet} copied={copied} onCopy={() => setCopied(true)}
          title="Get reviewed first: add the badge"
          text="Submissions whose website shows the AgentoolRank badge are reviewed before everyone else, and the badge shows live GitHub stars." />
        <KitBox />
      </div>
    );
  }

  const input = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-gray-700">GitHub repo (if open source)</span>
        <input name="github_url" type="url" placeholder="https://github.com/owner/repo" onBlur={prefill} data-testid="github-url" className={input} />
        <span className="text-xs text-gray-500">{prefilled || "Paste it first and we fill in the name, tagline and website for you."}</span>
      </label>
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
        <span className="text-sm font-medium text-gray-700">Your email *</span>
        <input name="email" type="email" required className={input} />
        <span className="text-xs text-gray-500">Only used to tell you when your page is live. Never shown publicly.</span>
      </label>
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        data-testid="submit-tool"
        data-vi-seen="submit_button"
        disabled={status === "loading"}
        className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60"
      >
        {status === "loading" ? "Submitting…" : "Submit for free"}
      </button>
    </form>
  );
}
