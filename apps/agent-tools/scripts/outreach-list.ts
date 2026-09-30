/**
 * Build the maker-outreach candidate list: top tools per category with a PUBLIC GitHub email
 * (user or org profile). Writes data/outreach/candidates.json (gitignored). Does not send anything.
 * Usage: GITHUB_TOKEN=… bun run scripts/outreach-list.ts [--per-category=8]
 */
import { config } from "dotenv";
import { createClient } from "@libsql/client";
import { mkdirSync, writeFileSync } from "node:fs";

config({ path: new URL("../.env.local", import.meta.url).pathname });
const per = Number(process.argv.find((a) => a.startsWith("--per-category="))?.split("=")[1] ?? 8);
const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });

const cats = (await db.execute("SELECT slug, name FROM categories")).rows as unknown as Array<{ slug: string; name: string }>;
const owners = new Map<string, { email: string; name: string } | null>();

async function ownerEmail(owner: string) {
  if (owners.has(owner)) return owners.get(owner)!;
  const res = await fetch(`https://api.github.com/users/${owner}`, { headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } });
  const u = res.ok ? await res.json() : null;
  const v = u?.email ? { email: String(u.email), name: String(u.name || owner) } : null;
  owners.set(owner, v);
  return v;
}

const out: Array<Record<string, unknown>> = [];
const seen = new Set<string>();
for (const c of cats) {
  const tools = (await db.execute({ sql: "SELECT id, name, github_owner FROM tools WHERE category_tags LIKE ? ORDER BY score DESC", args: [`%"${c.slug}"%`] })).rows as unknown as Array<{ id: string; name: string; github_owner: string }>;
  for (const [i, t] of tools.slice(0, per).entries()) {
    if (!t.github_owner || seen.has(t.id)) continue;
    const e = await ownerEmail(t.github_owner);
    if (!e) continue;
    seen.add(t.id);
    out.push({ slug: t.id, name: t.name, owner: e.name.split(" ")[0], email: e.email, category: c.name, rank: i + 1, total: tools.length });
  }
}
mkdirSync(new URL("../data/outreach", import.meta.url).pathname, { recursive: true });
writeFileSync(new URL("../data/outreach/candidates.json", import.meta.url).pathname, JSON.stringify(out, null, 1));
console.log(`categories=${cats.length} owners_checked=${owners.size} with_public_email=${out.length}`);
