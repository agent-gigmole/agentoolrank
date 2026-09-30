/**
 * Record paid AgentoolRank Checkout Sessions the thanks page may have missed (buyer closed the tab).
 * Uses the read-only ops key (~/.config/stripe/agentoolrank-ops.key) to list sessions; recording is idempotent.
 * Usage: bun run scripts/reconcile-payments.ts [--days=3]
 */
import { config } from "dotenv";
import { readFileSync } from "node:fs";

config({ path: new URL("../.env.local", import.meta.url).pathname });
const { recordPaidSession } = await import("../src/lib/paid");
const { paidAgentoolrankSessions } = await import("../src/lib/reconcile");

const days = Number(process.argv.find((a) => a.startsWith("--days="))?.split("=")[1] ?? 3);
const key = readFileSync(`${process.env.HOME}/.config/stripe/agentoolrank-ops.key`, "utf8").trim();
const since = Math.floor(Date.now() / 1000) - days * 86400;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sessions: any[] = [];
let after = "";
for (let page = 0; page < 10; page++) {
  const url = `https://api.stripe.com/v1/checkout/sessions?limit=100&created[gte]=${since}${after ? `&starting_after=${after}` : ""}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
  const data = await res.json();
  if (!res.ok) throw new Error(`Stripe ${res.status}: ${data?.error?.message}`);
  sessions.push(...data.data);
  if (!data.has_more) break;
  after = data.data[data.data.length - 1].id;
}

const paid = paidAgentoolrankSessions(sessions);
let recorded = 0;
for (const s of paid) {
  const r = await recordPaidSession(s);
  if (r.paid) recorded++;
}
console.log(`sessions=${sessions.length} agentoolrank_paid=${paid.length} recorded_or_confirmed=${recorded}`);
