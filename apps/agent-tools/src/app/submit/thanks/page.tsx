import type { Metadata } from "next";
import Link from "next/link";
import { confirmSession } from "@/lib/paid";
import { PLANS } from "@/lib/plans";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Thanks — AgentoolRank", robots: { index: false } };

export default async function ThanksPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  let result: Awaited<ReturnType<typeof confirmSession>> = { paid: false };
  try {
    if (session_id) result = await confirmSession(session_id);
  } catch (err) {
    console.error("confirm error:", err);
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-16 text-center">
      {result.paid && result.plan ? (
        <>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Payment received. Thank you!</h1>
          <p className="text-gray-600 mb-2">
            {PLANS[result.plan].description} We&apos;ll email you when your page is live.
          </p>
          <p className="text-sm text-gray-500 mb-8">Not approved in review? You get a full refund.</p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">We couldn&apos;t confirm this payment yet</h1>
          <p className="text-gray-600 mb-8">
            If you were charged, email <a className="underline" href="mailto:hello@agentoolrank.com">hello@agentoolrank.com</a> and we&apos;ll sort it out.
          </p>
        </>
      )}
      <Link href="/" className="text-blue-600 hover:underline">Back to AgentoolRank →</Link>
    </main>
  );
}
