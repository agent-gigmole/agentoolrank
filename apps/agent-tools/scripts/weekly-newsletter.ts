/**
 * Weekly digest to subscribers via Brevo transactional API.
 * Without ~/.config/secrets/brevo-api-key it only writes a preview to data/ops-logs/ (no sending).
 * Usage: bun run scripts/weekly-newsletter.ts [--send]
 */
import { config } from "dotenv";
import { createClient } from "@libsql/client";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { newsletterHtml, newsletterSubject } from "../src/lib/newsletter";

config({ path: new URL("../.env.local", import.meta.url).pathname });
const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });
const base = "https://agentoolrank.com";
const keyFile = `${process.env.HOME}/.config/secrets/brevo-api-key`;
const send = process.argv.includes("--send") && existsSync(keyFile);

const rows = async <T>(sql: string) => (await db.execute(sql)).rows as unknown as T[];
const gainers = await rows<{ id: string; name: string; gain: number; tagline: string }>("SELECT id, name, star_velocity_30d AS gain, tagline FROM tools WHERE star_velocity_30d IS NOT NULL ORDER BY star_velocity_30d DESC LIMIT 5");
const newTools = await rows<{ id: string; name: string; tagline: string }>("SELECT id, name, tagline FROM tools WHERE created_at >= datetime('now','-7 days') ORDER BY score DESC LIMIT 5");
const quiet = await rows<{ id: string; name: string; stars: number; lastCommit: string }>("SELECT id, name, github_stars AS stars, substr(last_commit_date,1,10) AS lastCommit FROM tools WHERE last_commit_date < date('now','-180 days') AND alternatives != '[]' ORDER BY github_stars DESC LIMIT 3");
const d = { weekLabel: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }), gainers, newTools, quiet, baseUrl: base };
const subject = newsletterSubject(d);

await db.execute("CREATE TABLE IF NOT EXISTS subscriber_tokens (email TEXT PRIMARY KEY, token TEXT NOT NULL UNIQUE)");
const subs = await rows<{ email: string }>("SELECT email FROM subscribers");
const preview = new URL(`../data/ops-logs/newsletter-${new Date().toISOString().slice(0, 10)}.html`, import.meta.url).pathname;
writeFileSync(preview, `<h2>${subject}</h2>\n${newsletterHtml(d, `${base}/unsubscribe?t=PREVIEW`)}`);
console.log(`subject="${subject}" subscribers=${subs.length} send=${send} preview=${preview}`);
if (!send) process.exit(0);

const key = readFileSync(keyFile, "utf8").trim();
let sent = 0;
for (const { email } of subs) {
  let t = (await db.execute({ sql: "SELECT token FROM subscriber_tokens WHERE email = ?", args: [email] })).rows[0]?.token as string | undefined;
  if (!t) {
    t = randomBytes(16).toString("hex");
    await db.execute({ sql: "INSERT OR IGNORE INTO subscriber_tokens (email, token) VALUES (?, ?)", args: [email, t] });
  }
  const unsub = `${base}/unsubscribe?t=${t}`;
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: { name: "AgentoolRank", email: "hello@agentoolrank.com" },
      to: [{ email }],
      subject,
      htmlContent: newsletterHtml(d, unsub),
      headers: { "List-Unsubscribe": `<${unsub}>` },
    }),
  });
  if (res.ok) sent++;
  else console.error(`send failed ${email.replace(/(.).+@/, "$1***@")}: ${res.status}`);
  await new Promise((r) => setTimeout(r, 300));
}
console.log(`sent=${sent}/${subs.length}`);
