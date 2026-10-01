import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getToolBySlug } from "@repo/db/queries";
import type { Tool } from "@repo/db/schema";
import { getTranslation } from "@/lib/i18n-data";
import { localizedAlternates } from "@/lib/i18n";
import { wan, zhToolTitle, zhToolFaq, zhStatus } from "@/lib/zh-tool";
import { clampDescription } from "@/lib/titles";
import { FaqSection } from "@/components/FaqSection";

export const revalidate = 86400;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [tool, tr] = await Promise.all([getToolBySlug(slug), getTranslation(slug, "zh")]);
  if (!tool || !tr) return {};
  return {
    title: zhToolTitle(tool.name, tr.tagline, tool.github_stars),
    description: clampDescription(`${tool.name}：${tr.tagline} ${zhStatus(tool, new Date())}`, 120),
    alternates: localizedAlternates(`/tool/${tool.id}`, ["zh"], "zh"),
  };
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-200 rounded-lg p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">{title}</h2>
      <ul className="list-disc pl-5 space-y-1 text-gray-700">
        {items.map((x) => <li key={x}>{x}</li>)}
      </ul>
    </section>
  );
}

export default async function ZhToolPage({ params }: Props) {
  const { slug } = await params;
  const [tool, tr] = await Promise.all([getToolBySlug(slug), getTranslation(slug, "zh")]);
  if (!tool || !tr) notFound();
  const now = new Date();
  const alts = (await Promise.all(tool.alternatives.slice(0, 6).map((id) => getToolBySlug(id)))).filter((t): t is Tool => t !== null);
  const altZh = await Promise.all(alts.map((a) => getTranslation(a.id, "zh")));
  const status = zhStatus(tool, now);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <nav className="text-sm text-gray-500 mb-4">
        <Link href="/zh" className="hover:underline">首页</Link> / {tool.name}
        <span className="float-right"><Link href={`/tool/${tool.id}`} hrefLang="en" className="hover:underline">English</Link></span>
      </nav>
      <h1 className="text-3xl font-bold text-gray-900">{tool.name}</h1>
      <p className="text-gray-600 mt-1 mb-4">{tr.tagline}</p>
      {status && <p className="mb-6 text-sm border border-blue-100 bg-blue-50/50 rounded-lg p-3 text-gray-800">{status}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <Stat label="GitHub 星数" value={tool.github_stars != null ? wan(tool.github_stars) : "—"} />
        <Stat label="近 30 天涨星" value={tool.star_velocity_30d != null ? `+${Math.max(0, Math.round(tool.star_velocity_30d)).toLocaleString("en-US")}` : "—"} />
        <Stat label="近 90 天提交" value={tool.commit_count_90d != null ? tool.commit_count_90d.toLocaleString("en-US") : "—"} />
        <Stat label="近 6 个月发版" value={tool.release_count_6m != null ? String(tool.release_count_6m) : "—"} />
      </div>

      {tr.description && <p className="text-gray-700 mb-6 leading-relaxed">{tr.description}</p>}
      {tr.key_differentiator && (
        <section className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">和同类工具的区别</h2>
          <p className="text-gray-700">{tr.key_differentiator}</p>
        </section>
      )}
      <List title="主要能力" items={tr.capabilities} />
      <div className="grid md:grid-cols-2 gap-x-8">
        <List title="适合" items={tr.best_for} />
        <List title="不太适合" items={tr.not_for} />
      </div>
      <List title="局限" items={tr.limitations} />

      {alts.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{tool.name} 的替代品</h2>
          <ul className="space-y-2">
            {alts.map((a, i) => (
              <li key={a.id} className="text-gray-700">
                <Link href={altZh[i] ? `/zh/tool/${a.id}` : `/tool/${a.id}`} className="font-medium text-blue-600 hover:underline">{a.name}</Link>
                {altZh[i] ? `：${altZh[i]!.tagline}` : ""}
                {a.github_stars != null ? <span className="text-gray-400 text-sm">（{wan(a.github_stars)}星）</span> : null}
              </li>
            ))}
          </ul>
          <p className="text-sm mt-2"><Link href={`/alternatives/${tool.id}`} className="text-blue-600 hover:underline">查看完整替代品对比（英文）→</Link></p>
        </section>
      )}

      <FaqSection faq={zhToolFaq(tool, tr, alts.map((a) => a.name), now)} title="常见问题" />

      <p className="text-xs text-gray-400 mt-10">
        星数、提交和发版数据来自 GitHub API，每天自动刷新。介绍文字由 AI 从英文翻译，并经过第二个模型的回译校对。
        {tool.github_url ? <> 项目地址：<a href={tool.github_url} rel="nofollow noopener" className="underline">{tool.github_url.replace("https://", "")}</a></> : null}
      </p>
      <div className="mt-6 border rounded-xl p-5 bg-gray-50 text-sm">
        <p className="font-semibold mb-1">你也在做 AI Agent 工具？</p>
        <p className="text-gray-600 mb-2">可以免费提交收录，也可以付费加急审核。</p>
        <Link href="/submit" className="text-blue-600 hover:underline">提交你的工具 →</Link>
      </div>
    </main>
  );
}
