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
const { isPaidKitSession } = await import("../src/lib/kit-checkout");
const { fulfillKitSession } = await import("../src/lib/kit-keys");

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
// Submit Kit: a buyer who closed the tab before /submit-kit/thanks never saw the key, so issue it here and email it.
let kitMailed = 0;
for (const s of sessions.filter(isPaidKitSession)) {
  const r = await fulfillKitSession(s);
  if (!r.key) continue;
  if (!r.email) { console.log(`kit ${s.id}: key issued but no buyer email — reissue manually`); continue; }
  const brevo = readFileSync(`${process.env.HOME}/.config/secrets/brevo-api-key`, "utf8").trim();
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": brevo, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: { name: "AgentoolRank", email: "hello@agentoolrank.com" },
      to: [{ email: r.email }],
      subject: "Your AgentoolRank Submit Kit key",
      textContent: `Thanks for buying the Submit Kit.\n\nYour key (valid 30 days):\n${r.key}\n\nUse it with our MCP server (https://agentoolrank.com/api/mcp):\nrecommend_directories({ "product_type": "ai_tool", "key": "${r.key}" })\n\nWe store only a hash of this key, so keep this email. Questions: reply here.\n\nAgentoolRank`,
      tags: ["kit-key"],
    }),
  });
  console.log(`kit ${s.id}: key emailed (${res.status})`);
  kitMailed++;
}
console.log(`sessions=${sessions.length} agentoolrank_paid=${paid.length} recorded_or_confirmed=${recorded} kit_mailed=${kitMailed}`);
