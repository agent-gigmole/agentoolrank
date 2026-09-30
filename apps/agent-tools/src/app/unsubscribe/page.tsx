import type { Metadata } from "next";
import { db } from "@repo/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Unsubscribe — AgentoolRank", robots: { index: false } };

// One-click unsubscribe from the weekly digest. Token table is additive (created by the sender script).
export default async function Unsubscribe({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  let done = false;
  if (t && /^[0-9a-f]{32}$/.test(t)) {
    try {
      const r = await db.execute({ sql: "SELECT email FROM subscriber_tokens WHERE token = ?", args: [t] });
      const email = r.rows[0]?.email as string | undefined;
      if (email) {
        await db.execute({ sql: "DELETE FROM subscribers WHERE email = ?", args: [email] });
        done = true;
      }
    } catch {
      done = false;
    }
  }
  return (
    <main className="max-w-md mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-bold mb-3">{done ? "You're unsubscribed" : "Link not recognized"}</h1>
      <p className="text-gray-600">{done ? "You won't get the weekly digest anymore." : "Email hello@agentoolrank.com and we'll remove you."}</p>
    </main>
  );
}
