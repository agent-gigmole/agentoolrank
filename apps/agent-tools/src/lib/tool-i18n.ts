// Localized tool-page copy (zh, ja), built from tracked data — no hand-written claims about tools.
import type { Tool } from "@repo/db/schema";
import type { Faq } from "./faq";
import type { ToolTranslation } from "./i18n";
import { staleness } from "./staleness";

export type PageLang = "zh" | "ja";
export const PAGE_LANGS: PageLang[] = ["zh", "ja"];

export const COPY = {
  zh: {
    home: "首页", english: "English", stars: "GitHub 星数", growth30: "近 30 天涨星", commits90: "近 90 天提交", releases6m: "近 6 个月发版",
    diff: "和同类工具的区别", capabilities: "主要能力", bestFor: "适合", notFor: "不太适合", limitations: "局限",
    altsOf: (n: string) => `${n} 的替代品`, fullAlts: "查看完整替代品对比（英文）→", faqTitle: "常见问题",
    footer: "星数、提交和发版数据来自 GitHub API，每天自动刷新。介绍文字由 AI 从英文翻译，并经过第二个模型的回译校对。", repo: "项目地址：",
    ctaTitle: "你也在做 AI Agent 工具？", ctaBody: "可以免费提交收录，也可以付费加急审核。", ctaLink: "提交你的工具 →",
    starsUnit: "星", colon: "：", paren: (s: string) => `（${s}）`,
    indexTitle: "开源 AI Agent 工具中文目录：按 GitHub 活跃度排名", indexH1: "开源 AI Agent 工具（中文）",
    indexIntro: (n: number) => `${n} 个开源 AI Agent 工具的中文介绍，按 GitHub 活跃度排序。星数、提交和发版数据每天从 GitHub API 自动刷新。`,
  },
  ja: {
    home: "ホーム", english: "English", stars: "GitHub スター", growth30: "直近 30 日のスター増加", commits90: "直近 90 日のコミット", releases6m: "直近 6 か月のリリース",
    diff: "他ツールとの違い", capabilities: "主な機能", bestFor: "向いている用途", notFor: "向いていない用途", limitations: "制限事項",
    altsOf: (n: string) => `${n} の代替ツール`, fullAlts: "代替ツールの詳しい比較（英語）→", faqTitle: "よくある質問",
    footer: "スター数・コミット・リリースのデータは GitHub API から毎日自動更新しています。紹介文は AI が英語から翻訳し、別のモデルで逆翻訳チェックを行っています。", repo: "リポジトリ：",
    ctaTitle: "AI エージェントツールを開発していますか？", ctaBody: "無料で掲載を申請できます。有料で審査を早めることもできます。", ctaLink: "ツールを登録する →",
    starsUnit: "スター", colon: "：", paren: (s: string) => `（${s}）`,
    indexTitle: "オープンソース AI エージェントツール一覧：GitHub の活動量でランキング", indexH1: "オープンソース AI エージェントツール",
    indexIntro: (n: number) => `${n} 件のオープンソース AI エージェントツールを、GitHub の活動量順に日本語で紹介しています。スター数・コミット・リリースのデータは GitHub API から毎日自動更新しています。`,
  },
} as const;

export function wan(n: number, lang: PageLang): string {
  if (n < 10000) return n.toLocaleString("en-US");
  const v = Math.round(n / 1000) / 10;
  const s = Number.isInteger(v) ? v.toFixed(0) : String(v);
  return lang === "zh" ? `${s} 万` : `${s}万`;
}

export function localToolTitle(lang: PageLang, name: string, tagline: string, stars: number | null): string {
  const t = tagline.replace(/[。.！!]+$/, "");
  let short = t;
  if (t.length > 32) {
    const head = t.slice(0, 32);
    const cut = Math.max(...["，", "、", "。", "；", " ", "（"].map((c) => head.lastIndexOf(c)));
    short = (cut >= 12 ? head.slice(0, cut) : head).trim();
  }
  return `${name}：${short}${stars ? ` · GitHub ${wan(stars, lang)}${COPY[lang].starsUnit}` : ""}`;
}

export function localStatus(lang: PageLang, tool: Tool, now: Date): string {
  const day = tool.last_commit_date?.slice(0, 10);
  if (!day) return "";
  const s = staleness(tool.last_commit_date, now);
  const n = tool.commit_count_90d ? tool.commit_count_90d.toLocaleString("en-US") : "";
  if (lang === "zh") {
    if (s.stale) return `最近一次提交在 ${day}，已经 ${s.months} 个月没有更新。`;
    return n ? `仍在活跃开发：最近 90 天有 ${n} 次提交，最近一次提交在 ${day}。` : `最近一次提交在 ${day}。`;
  }
  if (s.stale) return `最新コミットは ${day} で、${s.months} か月間更新がありません。`;
  return n ? `現在も活発に開発中：直近 90 日間のコミットは ${n} 件、最新コミットは ${day}。` : `最新コミットは ${day}。`;
}

export function localToolFaq(lang: PageLang, tool: Tool, tr: ToolTranslation, altNames: string[], now: Date): Faq[] {
  const n = tool.name;
  const status = localStatus(lang, tool, now);
  const zh = lang === "zh";
  const out: Faq[] = [{ q: zh ? `${n} 是做什么的？` : `${n} とは？`, a: tr.description || tr.tagline }];
  if (status) out.push({ q: zh ? `${n} 还在维护吗？` : `${n} は現在もメンテナンスされていますか？`, a: status });
  if (altNames.length) out.push({ q: zh ? `${n} 有哪些替代品？` : `${n} の代替ツールは？`, a: zh ? `和 ${n} 最接近的开源替代品有 ${altNames.join("、")}。` : `${n} に近いオープンソースの代替ツール：${altNames.join("、")}。` });
  if (tool.pricing === "open-source") out.push({ q: zh ? `${n} 是开源的吗？` : `${n} はオープンソースですか？`, a: zh ? `是的，${n} 是开源项目，代码托管在 GitHub 上。` : `はい。${n} はオープンソースで、コードは GitHub で公開されています。` });
  return out;
}
