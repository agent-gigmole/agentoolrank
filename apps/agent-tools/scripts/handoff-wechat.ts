/**
 * Fact sheet for operator-lab's WeChat article (handoff 10-03 22:36, due 10-05 20:00):
 * ~/data/handoff/ai-directory/wechat-directories.md. Every number is computed here from our own records; each line
 * states its source and window. No paid third-party data. Usage: bun run scripts/handoff-wechat.ts [--to=2026-10-05]
 */
import { config } from "dotenv";
import { createClient } from "@libsql/client";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import tested from "../src/lib/directories-tested.json";
import { compactCount, rankByDownloads } from "../src/lib/downloads";

config({ path: new URL("../.env.local", import.meta.url).pathname, quiet: true });
const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });
const FROM = "2026-09-30";
const TO = process.argv.find((a) => a.startsWith("--to="))?.split("=")[1] ?? new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);

// Shared submission log: our rows only, inside the window; latest row per domain is its current state.
const rows: string[][] = [];
for (const line of readFileSync(`${process.env.HOME}/data/backlinks/directory-log.csv`, "utf8").split("\n").slice(1)) {
  const c = line.match(/("([^"]|"")*"|[^,]*)(,|$)/g)?.map((x) => x.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"')) ?? [];
  if (c[2] === "ai-directory" && c[1] >= FROM && c[1] <= TO) rows.push(c);
}
const first = new Map<string, string>(), last = new Map<string, string[]>();
for (const r of rows) {
  if (r[3] === "submitted" && !first.has(r[0])) first.set(r[0], r[1]);
  last.set(r[0], r);
}
const submitted = [...last.values()].filter((r) => r[3] === "submitted");
const live = submitted.filter((r) => r[4].startsWith("【已上线】"));
const waits = live.map((r) => (Date.parse(r[1]) - Date.parse(first.get(r[0]) ?? r[1])) / 86400_000);
const avgWait = waits.length ? (waits.reduce((a, b) => a + b, 0) / waits.length).toFixed(1) : "—";

// Live listings we fetched ourselves (check-listings.ts): which link to the site, and whether the link is followable.
const status: Record<string, { found: boolean; rel: string | null; target?: string | null }> = existsSync("data/listings/status.json") ? JSON.parse(readFileSync("data/listings/status.json", "utf8")) : {};
const found = Object.entries(status).filter(([, v]) => v.found);
const siteLinks = found.filter(([, v]) => v.target !== "github");
const follow = siteLinks.filter(([, v]) => !/nofollow|ugc|sponsored/.test(v.rel ?? ""));

// 101 directories we went through (all three of our products, 09-29 → 10-02 notes).
const t = tested as { free: string; conditions: string[]; paidFrom: number | null }[];
const paidOnly = t.filter((x) => x.free === "no").length;
const hasPaidTier = t.filter((x) => x.paidFrom !== null).length;
const badge = t.filter((x) => x.conditions.includes("badge")).length;
const backlink = t.filter((x) => x.conditions.includes("backlink")).length;

// Visits from those directories: page_view sessions whose referrer host is one we submitted to (our own visits excluded).
const hosts = submitted.map((r) => r[0]);
const visits = hosts.length
  ? Number((await db.execute({ sql: `SELECT COUNT(DISTINCT sid) n FROM events WHERE name='page_view' AND src NOT LIKE '%selftest%' AND sid != 'selftest' AND ref IN (${hosts.map(() => "?").join(",")}) AND ts >= ? AND ts < date(?, '+1 day')`, args: [...hosts, FROM, TO] })).rows[0]?.n ?? 0)
  : 0;

const dl = rankByDownloads((await db.execute("SELECT t.id, t.name, t.github_stars, p.registry, p.package, p.downloads_30d FROM tool_packages p JOIN tools t ON t.id = p.tool_id WHERE p.downloads_30d IS NOT NULL")).rows
  .map((r) => ({ id: String(r.id), name: String(r.name), stars: r.github_stars === null ? null : Number(r.github_stars), registry: String(r.registry), package: String(r.package), downloads_30d: Number(r.downloads_30d) }))).slice(0, 5);

const md = `# AgentoolRank 目录站实测：事实稿（给 operator-lab 公众号）

生成时间：${new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 16).replace("T", " ")}（北京时间）· 时间窗口 ${FROM} → ${TO} · 全部来自我们自己的记录，没有第三方付费数据

## 我们这个站（agentoolrank.com）自己投目录站的结果
- **提交了多少**：${submitted.length} 个目录站（口径：共享提交日志里本项目、窗口内、当前状态为「已提交」的去重站点）。
- **确认上线几个**：${live.length} 个（口径：我们每天打开它在目录站上的页面，看到了指向我们的链接才算上线；有 ${found.filter(([, v]) => v.target === "github").length} 个只链到我们的 GitHub 仓库、没链官网，也算在内）。
- **给了可跟随外链的几个**：${follow.length} 个（口径：上线页面上指向 agentoolrank.com 的那个链接没有 nofollow/ugc/sponsored；共实测 ${siteLinks.length} 个链官网的页面）。
- **平均上线等待**：${avgWait} 天（口径：只算已确认上线的 ${live.length} 个，从第一次提交那天到确认上线那天；样本很小，仅供参考）。
- **带来的访客**：${visits} 个会话（口径：网站事件表里，来源网址是这些目录站的页面浏览会话，排除我们自己的访问；会话 = 浏览器标签页）。

## 我们实测过的 ${t.length} 个目录站（三个产品，09-29 → 10-02 的提交笔记）
- 只收费、没有免费档：${paidOnly} 个；有付费档（付费插队或加速）：${hasPaidTier} 个。
- 免费档要求在你网站挂徽章：${badge} 个；要求放回链：${backlink} 个（两类可重叠）。

## AgentoolRank /downloads：近 30 天 npm + PyPI 下载量前 5（口径：npm 下载 API 与 pypistats，包页面必须链回工具自己的仓库才算）
${dl.map((x, i) => `${i + 1}. ${x.name}：${compactCount(x.total)}`).join("\n")}

来源页面：https://agentoolrank.com/where-to-list（实测总表）· https://agentoolrank.com/downloads（下载量排行）
`;
const out = `${process.env.HOME}/data/handoff/ai-directory/wechat-directories.md`;
writeFileSync(out, md);
console.log(md);
