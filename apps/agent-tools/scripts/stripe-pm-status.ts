// Daily check (BOSS #29): are Alipay / WeChat Pay live on the account's own Default payment method config?
// Read-only key. Prints one line; exit 0 always so daily-ops keeps going.
import { readFileSync } from "node:fs";

const key = readFileSync(`${process.env.HOME}/.config/stripe/agentoolrank-ops.key`, "utf8").trim();
const res = await fetch("https://api.stripe.com/v1/payment_method_configurations?limit=20", {
  headers: { Authorization: `Basic ${Buffer.from(`${key}:`).toString("base64")}` },
});
const body = (await res.json()) as { data?: Array<Record<string, any>>; error?: { message: string } };
if (!body.data) {
  console.log(`${new Date().toISOString()} error: ${body.error?.message ?? res.status}`);
} else {
  // Connect-app child configs (application != null) don't govern our own Checkout sessions.
  const own = body.data.find((c) => c.is_default && !c.application);
  const show = (m: string) => `${m}=${own?.[m]?.display_preference?.value ?? "?"}/${own?.[m]?.available ? "available" : "pending"}`;
  console.log(`${new Date().toISOString()} ${own?.id ?? "no-default"} ${show("alipay")} ${show("wechat_pay")}`);
}
