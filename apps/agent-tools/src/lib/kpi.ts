// Daily KPI block for the ops dashboard (docs/ops/overview/index.html), rendered by scripts/kpi.ts.
export interface Window { visitors: number; submitViews: number; submissions: number; paid: number; revenueCents: number }
export interface KpiData {
  generated: string; day: string; yesterday: Window; week: Window;
  totalRevenueCents: number; externalSubmissions: number; monthRevenueCents: number; gscClicks28d: number | null; zhVisitors7d: number;
  jaVisitors7d: number; outreachSent: number; outreachVisitors7d: number; dirSubmitted: number; dirLive: number;
}

const CST_MS = 8 * 3600_000;
const sql = (d: Date) => d.toISOString().slice(0, 19).replace("T", " ");

/** China-time calendar day (offset 0 = today, -1 = yesterday) as UTC bounds for SQLite datetime('now') columns. */
export function cstDayRange(now: Date, offset: number): { day: string; from: string; to: string } {
  const local = new Date(now.getTime() + CST_MS);
  const start = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + offset) - CST_MS;
  return { day: new Date(start + CST_MS).toISOString().slice(0, 10), from: sql(new Date(start)), to: sql(new Date(start + 86400_000)) };
}

const usd = (c: number) => `$${(c / 100).toFixed(c % 100 ? 2 : 0)}`;
const kpi = (v: string | number, label: string) => `<div class="kpi"><b>${v}</b><span>${label}</span></div>`;
const done = (ok: boolean) => (ok ? " ✅" : "");

export function renderKpi(d: KpiData): string {
  const md = d.day.slice(5);
  const y = d.yesterday, w = d.week;
  return `
  <p class="muted">每日 KPI（自动生成 ${d.generated}，每小时刷新）</p>
  <div class="kpis">
    ${kpi(y.visitors, `访客（${md}）· 7 天 ${w.visitors}`)}
    ${kpi(y.submissions, `提交（${md}）· 7 天 ${w.submissions} · 提交页访客 ${w.submitViews}`)}
    ${kpi(y.paid, `付费单（${md}）· 7 天 ${w.paid}`)}
    ${kpi(usd(y.revenueCents), `收入（${md}）`)}
    ${kpi(usd(w.revenueCents), `近 7 天收入 · ${w.paid} 单`)}
    ${kpi(usd(d.totalRevenueCents), "累计收入")}
  </div>
  <p class="muted">目标进度：G2 外部提交 ${d.externalSubmissions}/20（10-21）${done(d.externalSubmissions >= 20)} · G3 首笔陌生人付款${d.totalRevenueCents > 0 ? " ✅" : " 0/1（10-31）"} · G4 月收入 ${usd(d.monthRevenueCents)}/$300、Google 点击 ${d.gscClicks28d ?? "?"}/1000（28 天，12-31）</p>
  <p class="muted">固定指标：外联：累计发出 ${d.outreachSent} 封 · 近 7 天带来 ${d.outreachVisitors7d} 个会话 ｜ 目录站：已提交 ${d.dirSubmitted} · 已确认上线 ${d.dirLive} ｜ 中文页访客 7 天 ${d.zhVisitors7d} · 日文页 ${d.jaVisitors7d}</p>
  `;
}

export function replaceBlock(html: string, block: string): string {
  const re = /(<!-- KPI:START -->)[\s\S]*?(<!-- KPI:END -->)/;
  if (!re.test(html)) throw new Error("KPI markers not found");
  return html.replace(re, `$1${block}$2`);
}

/** ops/daily.md: project-specific lines agentkit's bin/daily-report appends (first 15 lines, if updated within 36h). */
export function renderDaily(d: KpiData & { kitOrders7d: number; devtoVisitors7d: number }): string {
  const md = d.day.slice(5);
  return [
    `# AgentoolRank 项目数据（${d.generated} 北京时间自动生成）`,
    `- 访客：${md} ${d.yesterday.visitors}，近 7 天 ${d.week.visitors}`,
    `- 工具提交：昨天 ${d.yesterday.submissions}，近 7 天 ${d.week.submissions}（提交页访客 ${d.week.submitViews}）；累计外部提交 ${d.externalSubmissions}/20`,
    `- Submit Kit：近 7 天 ${d.kitOrders7d} 单（目标 10-18 前 3 单）`,
    `- 外联：累计 ${d.outreachSent} 封，近 7 天带来 ${d.outreachVisitors7d} 个会话`,
    `- 目录站：已提交 ${d.dirSubmitted}，已确认上线 ${d.dirLive}`,
    `- 渠道：dev.to 来源 7 天 ${d.devtoVisitors7d}；中文页访客 7 天 ${d.zhVisitors7d}，日文页 ${d.jaVisitors7d}`,
    `- SEO：Google 点击 28 天 ${d.gscClicks28d ?? "?"}（年底目标 1000）`,
    `- 收入：本月 ${usd(d.monthRevenueCents)}，累计 ${usd(d.totalRevenueCents)}`,
  ].join("\n") + "\n";
}
