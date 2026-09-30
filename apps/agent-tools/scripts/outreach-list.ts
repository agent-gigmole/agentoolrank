/**
 * Build the maker-outreach candidate list: top tools per category with a contact email the maintainers
 * publish on their project WEBSITE or README (not GitHub profile data — GitHub's terms forbid using it
 * for unsolicited email). Records where each email was found. Writes data/outreach/candidates.json
 * (gitignored). Does not send anything.
 * Usage: GITHUB_TOKEN=… bun run scripts/outreach-list.ts [--per-category=8]
 */
import { config } from "dotenv";
import { createClient } from "@libsql/client";
import { mkdirSync, writeFileSync } from "node:fs";
import { extractContactEmails } from "../src/lib/contact";

config({ path: new URL("../.env.local", import.meta.url).pathname });
const per = Number(process.argv.find((a) => a.startsWith("--per-category="))?.split("=")[1] ?? 8);
const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });

const cats = (await db.execute("SELECT slug, name FROM categories")).rows as unknown as Array<{ slug: string; name: string }>;
async function text(url: string): Promise<string> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "AgentoolRank/1.0 (+https://agentoolrank.com)" }, signal: AbortSignal.timeout(12000) });
    return res.ok ? await res.text() : "";
  } catch {
    return "";
  }
}

async function publishedContact(t: { website_url: string; github_url: string | null }) {
  const host = (() => { try { return new URL(t.website_url).hostname; } catch { return ""; } })();
  if (host && !host.endsWith("github.com")) {
    const e = extractContactEmails(await text(t.website_url), host)[0];
    if (e) return { email: e, source: t.website_url };
  }
  const m = t.github_url?.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (m) {
    const readme = `https://raw.githubusercontent.com/${m[1]}/${m[2]}/HEAD/README.md`;
    const e = extractContactEmails(await text(readme), host || undefined)[0];
    if (e) return { email: e, source: `README (${m[1]}/${m[2]})` };
  }
  return null;
}

const out: Array<Record<string, unknown>> = [];
const seen = new Set<string>();
for (const c of cats) {
  const tools = (await db.execute({ sql: "SELECT id, name, website_url, github_url FROM tools WHERE category_tags LIKE ? ORDER BY score DESC", args: [`%"${c.slug}"%`] })).rows as unknown as Array<{ id: string; name: string; website_url: string; github_url: string | null }>;
  for (const [i, t] of tools.slice(0, per).entries()) {
    if (seen.has(t.id)) continue;
    const c2 = await publishedContact(t);
    if (!c2) continue;
    seen.add(t.id);
    out.push({ slug: t.id, name: t.name, owner: "there", email: c2.email, email_source: c2.source, category: c.name, rank: i + 1, total: tools.length });
  }
}
mkdirSync(new URL("../data/outreach", import.meta.url).pathname, { recursive: true });
writeFileSync(new URL("../data/outreach/candidates.json", import.meta.url).pathname, JSON.stringify(out, null, 1));
console.log(`categories=${cats.length} candidates_with_published_contact=${out.length}`);
