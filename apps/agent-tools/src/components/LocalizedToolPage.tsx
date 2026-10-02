import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getToolBySlug } from "@repo/db/queries";
import type { Tool } from "@repo/db/schema";
import { getTranslation, translatedLangs } from "@/lib/i18n-data";
import { localizedAlternates } from "@/lib/i18n";
import { COPY, wan, localToolTitle, localToolFaq, localStatus, type PageLang } from "@/lib/tool-i18n";
import { clampDescription } from "@/lib/titles";
import { FaqSection } from "@/components/FaqSection";

// Shared localized tool page; thin routes live at src/app/<lang>/tool/[slug]/page.tsx.
export async function localizedToolMetadata(lang: PageLang, slug: string): Promise<Metadata> {
  const [tool, tr, langs] = await Promise.all([getToolBySlug(slug), getTranslation(slug, lang), translatedLangs(slug)]);
  if (!tool || !tr) return {};
  return {
    title: localToolTitle(lang, tool.name, tr.tagline, tool.github_stars),
    description: clampDescription(`${tool.name}${COPY[lang].colon}${tr.tagline} ${localStatus(lang, tool, new Date())}`, 120),
    alternates: localizedAlternates(`/tool/${tool.id}`, langs, lang),
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

export async function LocalizedToolPage({ lang, slug }: { lang: PageLang; slug: string }) {
  const [tool, tr] = await Promise.all([getToolBySlug(slug), getTranslation(slug, lang)]);
  if (!tool || !tr) notFound();
  const c = COPY[lang];
  const now = new Date();
  const alts = (await Promise.all(tool.alternatives.slice(0, 6).map((id) => getToolBySlug(id)))).filter((t): t is Tool => t !== null);
  const altTr = await Promise.all(alts.map((a) => getTranslation(a.id, lang)));
  const status = localStatus(lang, tool, now);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8" lang={lang === "zh" ? "zh-CN" : "ja"}>
      <nav className="text-sm text-gray-500 mb-4">
        <Link href={lang === "zh" ? "/zh/tools" : "/ja"} className="hover:underline">{c.home}</Link> / {tool.name}
        <span className="float-right"><Link href={`/tool/${tool.id}`} hrefLang="en" className="hover:underline">{c.english}</Link></span>
      </nav>
      <h1 className="text-3xl font-bold text-gray-900">{tool.name}</h1>
      <p className="text-gray-600 mt-1 mb-4">{tr.tagline}</p>
      {status && <p className="mb-6 text-sm border border-blue-100 bg-blue-50/50 rounded-lg p-3 text-gray-800">{status}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <Stat label={c.stars} value={tool.github_stars != null ? wan(tool.github_stars, lang) : "—"} />
        <Stat label={c.growth30} value={tool.star_velocity_30d != null ? `+${Math.max(0, Math.round(tool.star_velocity_30d)).toLocaleString("en-US")}` : "—"} />
        <Stat label={c.commits90} value={tool.commit_count_90d != null ? tool.commit_count_90d.toLocaleString("en-US") : "—"} />
        <Stat label={c.releases6m} value={tool.release_count_6m != null ? String(tool.release_count_6m) : "—"} />
      </div>

      {tr.description && <p className="text-gray-700 mb-6 leading-relaxed">{tr.description}</p>}
      {tr.key_differentiator && (
        <section className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">{c.diff}</h2>
          <p className="text-gray-700">{tr.key_differentiator}</p>
        </section>
      )}
      <List title={c.capabilities} items={tr.capabilities} />
      <div className="grid md:grid-cols-2 gap-x-8">
        <List title={c.bestFor} items={tr.best_for} />
        <List title={c.notFor} items={tr.not_for} />
      </div>
      <List title={c.limitations} items={tr.limitations} />

      {alts.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{c.altsOf(tool.name)}</h2>
          <ul className="space-y-2">
            {alts.map((a, i) => (
              <li key={a.id} className="text-gray-700">
                <Link href={altTr[i] ? `/${lang}/tool/${a.id}` : `/tool/${a.id}`} className="font-medium text-blue-600 hover:underline">{a.name}</Link>
                {altTr[i] ? `${c.colon}${altTr[i]!.tagline}` : ""}
                {a.github_stars != null ? <span className="text-gray-400 text-sm">{c.paren(`${wan(a.github_stars, lang)}${c.starsUnit}`)}</span> : null}
              </li>
            ))}
          </ul>
          <p className="text-sm mt-2"><Link href={`/alternatives/${tool.id}`} className="text-blue-600 hover:underline">{c.fullAlts}</Link></p>
        </section>
      )}

      <FaqSection faq={localToolFaq(lang, tool, tr, alts.map((a) => a.name), now)} title={c.faqTitle} />

      <p className="text-xs text-gray-400 mt-10">
        {c.footer}
        {tool.github_url ? <> {c.repo}<a href={tool.github_url} rel="nofollow noopener" className="underline">{tool.github_url.replace("https://", "")}</a></> : null}
      </p>
      <div className="mt-6 border rounded-xl p-5 bg-gray-50 text-sm">
        <p className="font-semibold mb-1">{c.ctaTitle}</p>
        <p className="text-gray-600 mb-2">{c.ctaBody}</p>
        <Link href="/submit" className="text-blue-600 hover:underline">{c.ctaLink}</Link>
      </div>
    </main>
  );
}
