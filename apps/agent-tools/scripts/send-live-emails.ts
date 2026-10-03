/**
 * "Your page is live" emails (the /submit form promises one). For every approved submission whose tool page exists and
 * that has not been emailed yet: send once via Brevo (transactional, tag "live-notify", not counted as outreach),
 * then record it in live_emails so it is never sent twice.
 * Usage: bun run scripts/send-live-emails.ts [--dry-run]   (daily-ops runs it right after review-submissions --apply)
 */
import { config } from "dotenv";
import { createClient } from "@libsql/client";
import { readFileSync } from "node:fs";
import { liveEmail } from "../src/lib/live-email";
import { kitTypeForCategories } from "../src/lib/directory-kit";

config({ path: new URL("../.env.local", import.meta.url).pathname, quiet: true });
const dry = process.argv.includes("--dry-run");
const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });
const BASE = process.env.NEXT_PUBLIC_BASE_URL || "https://agentoolrank.com";

await db.execute(`CREATE TABLE IF NOT EXISTS live_emails (
  submission_id INTEGER PRIMARY KEY,
  sent_at TEXT NOT NULL DEFAULT (datetime('now')),
  message_id TEXT NOT NULL DEFAULT ''
)`);
const rows = (await db.execute(`SELECT s.id, s.slug, s.email, t.name, t.category_tags FROM submissions s JOIN tools t ON t.id = s.slug
  WHERE s.status = 'approved' AND s.email LIKE '%@%' AND s.src NOT LIKE '%selftest%' AND s.note NOT LIKE '%selftest%'
    AND s.id NOT IN (SELECT submission_id FROM live_emails) ORDER BY s.id`)).rows as unknown as Array<{ id: number; slug: string; email: string; name: string; category_tags: string | null }>;
console.log(`live emails due: ${rows.length}${dry ? " (dry run)" : ""}`);

const tags = (v: string | null): string[] => {
  try {
    const j = JSON.parse(v ?? "[]");
    return Array.isArray(j) ? j.map(String) : [];
  } catch {
    return String(v ?? "").split(",");
  }
};
const key = readFileSync(`${process.env.HOME}/.config/secrets/brevo-api-key`, "utf8").trim();
for (const r of rows) {
  const { subject, text } = liveEmail({ name: r.name, slug: r.slug, baseUrl: BASE, kitType: kitTypeForCategories(tags(r.category_tags)) });
  const masked = r.email.replace(/^(.).*@/, "$1***@");
  if (dry) {
    console.log(`#${r.id} ${r.slug} -> ${masked}: ${subject}`);
    continue;
  }
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: { name: "Jason T.", email: "hello@agentoolrank.com" },
      replyTo: { email: "hello@agentoolrank.com", name: "Jason T." },
      to: [{ email: r.email }],
      subject,
      textContent: text,
      tags: ["live-notify"],
    }),
  });
  const data = (await res.json().catch(() => ({}))) as { messageId?: string };
  if (!res.ok) {
    console.log(`#${r.id} ${r.slug}: brevo ${res.status}, will retry next run`);
    process.exitCode = 1;
    continue;
  }
  await db.execute({ sql: "INSERT INTO live_emails (submission_id, message_id) VALUES (?, ?)", args: [r.id, String(data.messageId ?? "")] });
  console.log(`#${r.id} ${r.slug} -> ${masked}: sent`);
}
