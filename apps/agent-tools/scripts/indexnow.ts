/**
 * Ping IndexNow (Bing, Yandex, Seznam…; Bing also feeds ChatGPT search) with every URL in the live sitemap.
 * Key file lives at public/<key>.txt. Usage: bun run scripts/indexnow.ts [--dry-run]
 */
import { readdirSync } from "node:fs";

const HOST = "agentoolrank.com";
const key = readdirSync(new URL("../public", import.meta.url).pathname).find((f) => /^[0-9a-f]{32}\.txt$/.test(f))?.replace(".txt", "");
if (!key) throw new Error("no IndexNow key file in public/");

const xml = await (await fetch(`https://${HOST}/sitemap.xml`)).text();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
console.log(`urls=${urls.length} key=${key.slice(0, 6)}…`);
if (process.argv.includes("--dry-run")) process.exit(0);

for (let i = 0; i < urls.length; i += 10000) {
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key, keyLocation: `https://${HOST}/${key}.txt`, urlList: urls.slice(i, i + 10000) }),
  });
  console.log(`batch ${i / 10000 + 1}: HTTP ${res.status} ${(await res.text()).slice(0, 120)}`);
}
