/**
 * npm / PyPI monthly downloads for every tool that publishes a package (new data source, weekly review 2026-10-05).
 * Package name: from the tool's own repo (package.json, pyproject.toml, setup.py at the default branch root).
 * Kept only if the registry metadata links back to the same GitHub repo. Rate-limited (npm ~1 req/s, pypistats 1 per 2 s,
 * well under both services' fair use; pypistats asks bulk users for BigQuery, we only do one call per package per week).
 * Writes Turso table tool_packages (additive). Usage: bun run scripts/fetch-downloads.ts [--limit=N] [--only=<tool id>] [--missing]
 *   --missing: only re-fetch counts for packages already found whose downloads_30d is empty (e.g. after rate limiting).
 */
import { config } from "dotenv";
import { createClient } from "@libsql/client";
import { candidateNames, githubRepo, npmNameFromPackageJson, pypiNameFromPyproject, pypiNameFromSetupPy, repoMatches } from "../src/lib/downloads";

config({ path: new URL("../.env.local", import.meta.url).pathname, quiet: true });
const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });
const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=")[1];
const UA = { "User-Agent": "AgentoolRank/1.0 (+https://agentoolrank.com; hello@agentoolrank.com)" };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

await db.execute(`CREATE TABLE IF NOT EXISTS tool_packages (
  tool_id TEXT NOT NULL,
  registry TEXT NOT NULL CHECK(registry IN ('npm','pypi')),
  package TEXT NOT NULL,
  downloads_30d INTEGER,
  fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (tool_id, registry)
)`);

async function get(url: string, json = false): Promise<any> {
  // pypistats rate-limits bulk runs (429): back off and retry instead of storing an empty count (10-03: 78 packages blank).
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(15000) });
      if (res.status === 429) {
        await sleep(Number(res.headers.get("retry-after") ?? 0) * 1000 || 15000 * (attempt + 1));
        continue;
      }
      if (!res.ok) return null;
      return json ? await res.json() : await res.text();
    } catch {
      return null;
    }
  }
  return null;
}

if (process.argv.includes("--missing")) {
  const miss = (await db.execute("SELECT tool_id, registry, package FROM tool_packages WHERE downloads_30d IS NULL")).rows;
  let fixed = 0;
  for (const m of miss) {
    const pkg = String(m.package);
    const d = m.registry === "npm"
      ? (await get(`https://api.npmjs.org/downloads/point/last-month/${pkg}`, true))?.downloads
      : (await get(`https://pypistats.org/api/packages/${pkg.toLowerCase()}/recent`, true))?.data?.last_month;
    if (typeof d === "number") {
      await db.execute({ sql: "UPDATE tool_packages SET downloads_30d = ?, fetched_at = datetime('now') WHERE tool_id = ? AND registry = ?", args: [d, String(m.tool_id), String(m.registry)] });
      fixed++;
    }
    await sleep(m.registry === "npm" ? 500 : 3000);
  }
  console.log(`downloads --missing: ${miss.length} empty, ${fixed} filled`);
  process.exit(0);
}

const only = arg("only");
const tools = (await db.execute(only ? { sql: "SELECT id, name, github_url FROM tools WHERE id = ?", args: [only] } : "SELECT id, name, github_url FROM tools WHERE github_url IS NOT NULL ORDER BY score DESC")).rows
  .slice(0, Number(arg("limit") ?? 10_000));
let npmN = 0, pypiN = 0;
for (const t of tools) {
  const gh = githubRepo(String(t.github_url));
  if (!gh) continue;
  const raw = (f: string) => get(`https://raw.githubusercontent.com/${gh.owner}/${gh.repo}/HEAD/${f}`);
  const found: { registry: "npm" | "pypi"; pkg: string; dl: number | null }[] = [];

  const base = { repo: gh.repo, id: String(t.id), name: String(t.name) };
  // npm: first candidate whose registry metadata links back to this repo.
  for (const pkg of candidateNames({ ...base, manifest: npmNameFromPackageJson((await raw("package.json")) ?? "") }, "npm")) {
    const meta = await get(`https://registry.npmjs.org/${pkg.replace("/", "%2F")}/latest`, true);
    await sleep(400);
    const repoUrl = typeof meta?.repository === "string" ? meta.repository : meta?.repository?.url;
    if (!repoMatches(repoUrl, gh.owner, gh.repo)) continue;
    const d = await get(`https://api.npmjs.org/downloads/point/last-month/${pkg}`, true);
    found.push({ registry: "npm", pkg, dl: typeof d?.downloads === "number" ? d.downloads : null });
    break;
  }
  // PyPI: same, checking home_page and project_urls.
  const pyManifest = pypiNameFromPyproject((await raw("pyproject.toml")) ?? "") ?? pypiNameFromSetupPy((await raw("setup.py")) ?? "");
  for (const pkg of candidateNames({ ...base, manifest: pyManifest }, "pypi")) {
    const meta = await get(`https://pypi.org/pypi/${pkg}/json`, true);
    await sleep(400);
    const urls = [meta?.info?.home_page, ...Object.values(meta?.info?.project_urls ?? {})] as string[];
    if (!urls.some((u) => repoMatches(u, gh.owner, gh.repo))) continue;
    await sleep(2000);
    const d = await get(`https://pypistats.org/api/packages/${pkg.toLowerCase()}/recent`, true);
    found.push({ registry: "pypi", pkg, dl: typeof d?.data?.last_month === "number" ? d.data.last_month : null });
    break;
  }
  for (const f of found) {
    await db.execute({
      sql: "INSERT INTO tool_packages (tool_id, registry, package, downloads_30d, fetched_at) VALUES (?, ?, ?, ?, datetime('now')) ON CONFLICT(tool_id, registry) DO UPDATE SET package=excluded.package, downloads_30d=COALESCE(excluded.downloads_30d, tool_packages.downloads_30d), fetched_at=excluded.fetched_at",
      args: [String(t.id), f.registry, f.pkg, f.dl],
    });
    if (f.registry === "npm") npmN++; else pypiN++;
    console.log(`${t.id}\t${f.registry}\t${f.pkg}\t${f.dl ?? "?"}`);
  }
  await sleep(300);
}
console.log(`downloads: ${tools.length} tools checked, npm ${npmN}, pypi ${pypiN}`);
