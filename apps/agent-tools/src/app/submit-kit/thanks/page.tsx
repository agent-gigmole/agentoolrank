import type { Metadata } from "next";
import Link from "next/link";
import { stripe } from "@/lib/paid";
import { isPaidKitSession } from "@/lib/kit-checkout";
import { fulfillKitSession } from "@/lib/kit-keys";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your Submit Kit key — AgentoolRank", robots: { index: false } };

export default async function KitThanks({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  let result: { key?: string; alreadyIssued?: boolean } | null = null;
  try {
    if (session_id && /^cs_(live|test)_[A-Za-z0-9]+$/.test(session_id)) {
      const s = await stripe(`checkout/sessions/${session_id}`);
      if (isPaidKitSession(s)) result = await fulfillKitSession(s);
    }
  } catch (err) {
    console.error("kit thanks error:", err);
  }
  return (
    <main className="max-w-xl mx-auto px-4 py-16">
      {result?.key ? (
        <>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Payment received. Here is your key</h1>
          <p className="text-gray-600 mb-3">Copy it now: we store only a hash, so this page cannot show it again. It works for 30 days.</p>
          <pre className="bg-gray-900 text-green-300 rounded-lg p-4 text-sm overflow-x-auto mb-4 select-all">{result.key}</pre>
          <pre className="bg-gray-50 border rounded-lg p-3 text-xs overflow-x-auto mb-6">{`recommend_directories({ "product_type": "ai_tool", "key": "${result.key}" })`}</pre>
        </>
      ) : result?.alreadyIssued ? (
        <>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Your key was already issued</h1>
          <p className="text-gray-600 mb-6">It was shown once after payment. Lost it? Email <a className="underline" href="mailto:hello@agentoolrank.com">hello@agentoolrank.com</a> from your purchase email and we will reissue it.</p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">We couldn&apos;t confirm this payment yet</h1>
          <p className="text-gray-600 mb-6">If you were charged, your key will be emailed within the hour, or email <a className="underline" href="mailto:hello@agentoolrank.com">hello@agentoolrank.com</a>.</p>
        </>
      )}
      <Link href="/submit-kit" className="text-blue-600 hover:underline">Back to Submit Kit →</Link>
    </main>
  );
}
