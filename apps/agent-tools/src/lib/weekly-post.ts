// Weekly "fastest-growing agent tools" X post draft (sent to Telegram for approval).
export interface Gainer {
  id: string;
  name: string;
  gain: number; // stars gained in the window (or 30-day pace until daily snapshots cover a week)
  tagline: string;
}

export function weeklyPostText(tools: Gainer[], weekLabel: string, baseUrl: string): string {
  const lines = tools.slice(0, 5).map((t, i) => `${i + 1}. ${t.name} +${Math.round(t.gain).toLocaleString("en-US")}`);
  const host = baseUrl.replace(/^https?:\/\//, "");
  return [`本周（${weekLabel}）GitHub 上涨星最快的 AI Agent 开源工具：`, "", ...lines, "", "每天自动更新的榜单和替代品对比：", `${host}/weekly?ref=x-weekly`].join("\n");
}
