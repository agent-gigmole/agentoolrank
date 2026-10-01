// Chinese tool-page copy built from tracked data (no hand-written claims).
import type { Tool } from "@repo/db/schema";
import type { Faq } from "./faq";
import type { ToolTranslation } from "./i18n";
import { staleness } from "./staleness";

export function wan(n: number): string {
  if (n < 10000) return n.toLocaleString("en-US");
  const v = Math.round(n / 1000) / 10;
  return `${Number.isInteger(v) ? v.toFixed(0) : v} 万`;
}

export function zhToolTitle(name: string, tagline: string, stars: number | null): string {
  const t = tagline.replace(/[。.！!]+$/, "");
  const short = t.length > 28 ? t.slice(0, 28) : t;
  return `${name}：${short}${stars ? ` · GitHub ${wan(stars)}星` : ""}`;
}

export function zhStatus(tool: Tool, now: Date): string {
  const day = tool.last_commit_date?.slice(0, 10);
  if (!day) return "";
  const s = staleness(tool.last_commit_date, now);
  if (s.stale) return `最近一次提交在 ${day}，已经 ${s.months} 个月没有更新。`;
  return tool.commit_count_90d ? `仍在活跃开发：最近 90 天有 ${tool.commit_count_90d.toLocaleString("en-US")} 次提交，最近一次提交在 ${day}。` : `最近一次提交在 ${day}。`;
}

export function zhToolFaq(tool: Tool, tr: ToolTranslation, altNames: string[], now: Date): Faq[] {
  const out: Faq[] = [{ q: `${tool.name} 是做什么的？`, a: tr.description || tr.tagline }];
  const status = zhStatus(tool, now);
  if (status) out.push({ q: `${tool.name} 还在维护吗？`, a: status });
  if (altNames.length) out.push({ q: `${tool.name} 有哪些替代品？`, a: `和 ${tool.name} 最接近的开源替代品有 ${altNames.join("、")}。` });
  if (tool.pricing === "open-source") out.push({ q: `${tool.name} 是开源的吗？`, a: `是的，${tool.name} 是开源项目，代码托管在 GitHub 上。` });
  return out;
}
