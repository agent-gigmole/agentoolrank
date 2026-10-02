import Link from "next/link";
import type { Metadata } from "next";
import { translatedToolList } from "@/lib/i18n-data";
import { COPY, wan, type PageLang } from "@/lib/tool-i18n";

const BASE = "https://agentoolrank.com";
const INDEX_PATH: Record<PageLang, string> = { zh: "/zh/tools", ja: "/ja" };

// Localized index of every reviewed tool page, so the /zh and /ja tool pages are reachable by internal links.
export function localizedIndexMetadata(lang: PageLang): Metadata {
  return {
    title: COPY[lang].indexTitle,
    description: COPY[lang].indexIntro(200),
    alternates: {
      canonical: `${BASE}${INDEX_PATH[lang]}`,
      languages: { en: BASE, zh: `${BASE}${INDEX_PATH.zh}`, ja: `${BASE}${INDEX_PATH.ja}`, "x-default": BASE },
    },
  };
}

export async function LocalizedToolIndex({ lang }: { lang: PageLang }) {
  const c = COPY[lang];
  const tools = await translatedToolList(lang);
  return (
    <main className="max-w-4xl mx-auto px-4 py-8" lang={lang === "zh" ? "zh-CN" : "ja"}>
      <nav className="text-sm text-gray-500 mb-4">
        <Link href={lang === "zh" ? "/zh" : "/"} className="hover:underline">{c.home}</Link>
        <span className="float-right"><Link href="/" hrefLang="en" className="hover:underline">{c.english}</Link></span>
      </nav>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{c.indexH1}</h1>
      <p className="text-gray-600 mb-8">{c.indexIntro(tools.length)}</p>
      <ol className="space-y-3">
        {tools.map((t, i) => (
          <li key={t.id} className="border-b border-gray-100 pb-3">
            <span className="text-gray-400 text-sm mr-2">{i + 1}.</span>
            <Link href={`/${lang}/tool/${t.id}`} className="font-medium text-blue-600 hover:underline">{t.name}</Link>
            {t.stars != null ? <span className="text-gray-400 text-sm">{c.paren(`${wan(t.stars, lang)}${c.starsUnit}`)}</span> : null}
            <p className="text-sm text-gray-600 mt-1">{t.tagline}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}
