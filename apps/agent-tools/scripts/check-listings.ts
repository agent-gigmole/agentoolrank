/**
 * Daily listing check (runs in daily-ops.sh → timer agentoolrank-daily): for every directory we submitted to, fetch the
 * listing page (URL from our log, else the usual /tool/agentoolrank-style paths) and look for our link and its rel.
 * Newly confirmed listings are written back to the shared log via dirsub (result stays "submitted", detail starts
 * 【已上线】, which is what the dashboard counts). A page we can't confirm is reported, never downgraded: many
 * directories render links with JavaScript, so "not found in HTML" is not proof the listing is gone.
 * Usage: bun run scripts/check-listings.ts [--dry-run]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { config } from "dotenv";
import { createClient } from "@libsql/client";
import { CREATE_LISTING_CHECKS, candidateUrls, findBacklink, knownListingUrl } from "../src/lib/listing-check";

const LOG = `${process.env.HOME}/data/backlinks/directory-log.csv`;
const DIRSUB = `${process.env.HOME}/project/agentkit/skills/directory-submission/scripts/dirsub.py`;
const OUT = new URL("../data/listings/status.json", import.meta.url).pathname;
const dryRun = process.argv.includes("--dry-run");
const UA = "Mozilla/5.0 (compatible; AgentoolRank listing check; +https://agentoolrank.com)";
const today = new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);

const last = new Map<string, string[]>();
for (const line of readFileSync(LOG, "utf8").split("\n").slice(1)) {
  const cols = line.match(/("([^"]|"")*"|[^,]*)(,|$)/g)?.map((c) => c.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"')) ?? [];
  if (cols[2] === "ai-directory") last.set(cols[0], cols);
}
const targets = [...last.values()].filter((c) => c[3] === "submitted");

async function page(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow", signal: AbortSignal.timeout(15000) });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}

const status: Record<string, { checked: string; url: string | null; found: boolean; rel: string | null; target?: string | null }> = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};
let confirmed = 0, newlyLive = 0, unconfirmed = 0;
for (const [domain, , , , detail] of targets) {
  const wasLive = detail.startsWith("【已上线】");
  let hit: { url: string; rel: string | null; target: string | null } | null = null;
  for (const url of candidateUrls(domain, knownListingUrl(domain, detail))) {
    const html = await page(url);
    await new Promise((r) => setTimeout(r, 1500)); // one request every 1.5 s, sites are small
    const b = html ? findBacklink(html) : { found: false, rel: null, target: null };
    if (b.found) { hit = { url, rel: b.rel, target: b.target }; break; }
  }
  status[domain] = { checked: today, url: hit?.url ?? null, found: !!hit, rel: hit?.rel ?? null, target: hit?.target ?? null };
  if (hit) {
    confirmed++;
    if (!wasLive) {
      newlyLive++;
      const msg = `【已上线】${hit.url}（${today} 自动复查：${hit.target === "github" ? "页面只链到我们的 GitHub 仓库，没有链到 agentoolrank.com" : "页面上有指向 agentoolrank.com 的链接"}，rel=${hit.rel}）`;
      console.log(`NEW LIVE ${domain}: ${msg}`);
      if (!dryRun) {
        const r = spawnSync("python3", [DIRSUB, "add", domain, "--project", "ai-directory", "--result", "submitted", "--detail", msg, "--update"], { encoding: "utf8" });
        if (r.status !== 0) throw new Error(`dirsub add ${domain} failed: ${r.stderr.slice(0, 200)}`);
      }
    }
  } else {
    unconfirmed++;
    if (wasLive) console.log(`WARN ${domain}: logged as live but our link wasn't found in the HTML (JS-rendered, moved or removed) — check by hand`);
  }
}
// Publish our results for /where-to-list ("Our result" column): live (we saw our link, or the log says live) or submitted.
if (!dryRun) {
  config({ path: new URL("../.env.local", import.meta.url).pathname, quiet: true });
  const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });
  await db.execute(CREATE_LISTING_CHECKS);
  for (const [domain, , , , detail] of targets) {
    const st = status[domain];
    const live = st?.found || detail.startsWith("【已上线】");
    await db.execute({
      sql: "INSERT INTO listing_checks (domain, state, url, rel, target, checked) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(domain) DO UPDATE SET state=excluded.state, url=excluded.url, rel=excluded.rel, target=excluded.target, checked=excluded.checked",
      args: [domain, live ? "live" : "submitted", st?.url ?? null, st?.rel ?? null, st?.target ?? null, today],
    });
  }
}
if (!dryRun) {
  mkdirSync(new URL("../data/listings/", import.meta.url).pathname, { recursive: true });
  writeFileSync(OUT, JSON.stringify(status, null, 2));
}
console.log(`listings: checked ${targets.length}, link found ${confirmed} (new ${newlyLive}), not confirmed ${unconfirmed}`);
