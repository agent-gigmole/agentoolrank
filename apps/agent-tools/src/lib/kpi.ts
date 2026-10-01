// Daily KPI block for the ops dashboard (docs/ops/overview/index.html), rendered by scripts/kpi.ts.
export interface Window { visitors: number; submitViews: number; submissions: number; paid: number; revenueCents: number }
export interface KpiData {
  generated: string; day: string; yesterday: Window; week: Window;
  totalRevenueCents: number; externalSubmissions: number; monthRevenueCents: number; gscClicks28d: number | null; zhVisitors7d: number;
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
  <p class="muted">目标进度：G2 外部提交 ${d.externalSubmissions}/20（10-21）${done(d.externalSubmissions >= 20)} · G3 首笔陌生人付款${d.totalRevenueCents > 0 ? " ✅" : " 0/1（10-31）"} · G4 月收入 ${usd(d.monthRevenueCents)}/$300、Google 点击 ${d.gscClicks28d ?? "?"}/1000（28 天，12-31）· 中文页访客 7 天 ${d.zhVisitors7d}（大陆付款方式待核，见 T24）</p>
  `;
}

export function replaceBlock(html: string, block: string): string {
  const re = /(<!-- KPI:START -->)[\s\S]*?(<!-- KPI:END -->)/;
  if (!re.test(html)) throw new Error("KPI markers not found");
  return html.replace(re, `$1${block}$2`);
}
