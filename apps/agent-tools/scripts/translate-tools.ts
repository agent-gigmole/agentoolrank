/**
 * Translate tool-page copy (tagline, description, intelligence lists) for localized pages.
 * Translator: Sub2API gpt-6-astra. Reviewer: a different model family (OpenRouter DeepSeek) that
 * back-translates and checks modal direction (must / must not / need not / may / should).
 * Deterministic checks: numbers preserved, no untranslated English runs.
 * Only rows with status='approved' are published (src/app/zh/tool/[slug]).
 * Usage: bun run scripts/translate-tools.ts --lang=zh [--top=200] [--only=dify,ragflow] [--retry-failed] [--dry-run]
 *   Rows whose source text is unchanged are skipped; --retry-failed also redoes unchanged rows that failed review.
 */
import { config } from "dotenv";
import { createClient } from "@libsql/client";
import { createHash } from "node:crypto";
import { llm, openrouter, llmStats } from "./llm";
import { parseToolTranslation, numbersPreserved, residualEnglish, type ToolTranslation } from "../src/lib/i18n";

config({ path: new URL("../.env.local", import.meta.url).pathname, quiet: true });
const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=")[1];
const lang = arg("lang") ?? "zh";
const top = Number(arg("top") ?? 200);
const only = arg("only")?.split(",");
const dryRun = process.argv.includes("--dry-run");
const retryFailed = process.argv.includes("--retry-failed");
const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });

const LANG_NAME: Record<string, string> = { zh: "Simplified Chinese (zh-CN)", ja: "Japanese" };
const GLOSSARY: Record<string, string> = {
  zh: `Keep in English: product and project names, Agent, MCP, RAG, LLM, SDK, API, CLI, GPU, Python/TypeScript and other language names, model names. Use: open-source → 开源; framework → 框架; workflow → 工作流; self-hosted → 自托管; orchestration → 编排; observability → 可观测性; evaluation → 评估; fine-tuning → 微调; inference → 推理; vector database → 向量数据库; knowledge base → 知识库; plugin → 插件; low-code → 低代码; no-code → 无代码.`,
  ja: `Keep in English: product and project names, Agent, MCP, RAG, LLM, SDK, API, CLI, GPU, programming language names, model names. Use: open-source → オープンソース; framework → フレームワーク; workflow → ワークフロー; self-hosted → セルフホスト; orchestration → オーケストレーション; observability → オブザーバビリティ; evaluation → 評価; fine-tuning → ファインチューニング; inference → 推論; vector database → ベクトルデータベース; knowledge base → ナレッジベース; plugin → プラグイン; low-code → ローコード; no-code → ノーコード. Use plain desu/masu style in descriptions and noun phrases in lists.`,
};
const MODALS: Record<string, string> = {
  zh: "must=必须/需要, must not=不得/不能/禁止, need not=不必/无需, may=可以, should=应当/建议",
  ja: "must=〜なければならない/必要, must not=〜てはいけない/禁止/不可, need not=〜なくてもよい/不要, may=〜てもよい/可能, should=〜べき/推奨",
};

await db.execute(`CREATE TABLE IF NOT EXISTS tool_i18n (
  tool_id TEXT NOT NULL, lang TEXT NOT NULL, content TEXT NOT NULL, status TEXT NOT NULL,
  issues TEXT NOT NULL DEFAULT '', source_hash TEXT NOT NULL, human_reviewed INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY (tool_id, lang))`);

interface Row { id: string; name: string; tagline: string; description: string; intelligence: string }

function source(r: Row): ToolTranslation {
  let intel: Record<string, unknown> = {};
  try { intel = JSON.parse(r.intelligence || "{}"); } catch { /* keep empty */ }
  const list = (k: string) => (Array.isArray(intel[k]) ? (intel[k] as unknown[]).filter((x): x is string => typeof x === "string") : []);
  return {
    tagline: r.tagline, description: r.description,
    key_differentiator: typeof intel.key_differentiator === "string" ? intel.key_differentiator : "",
    capabilities: list("capabilities"), best_for: list("best_for"), not_for: list("not_for"), limitations: list("limitations"),
  };
}

const flat = (t: ToolTranslation) => [t.tagline, t.description, t.key_differentiator, ...t.capabilities, ...t.best_for, ...t.not_for, ...t.limitations];

async function translate(r: Row, src: ToolTranslation): Promise<ToolTranslation | null> {
  const prompt = `Translate this AI developer tool's directory copy into ${LANG_NAME[lang]} for developers. Natural, concise, technical tone; no marketing fluff.
Rules: translate meaning exactly, add nothing, drop nothing; keep every number exactly as written; keep the project name "${r.name}" unchanged; keep code, URLs and identifiers unchanged; keep each list the same length and order; keep the exact modal meaning of every sentence (must / must not / need not / may / should).
Glossary: ${GLOSSARY[lang]}

Source JSON:
${JSON.stringify(src, null, 1)}

Reply with JSON only, same keys.`;
  return parseToolTranslation(await llm(prompt, { model: "gpt-6-astra", maxTokens: 2500, temperature: 0.2, noFallback: true }));
}

function deterministic(r: Row, src: ToolTranslation, dst: ToolTranslation): string[] {
  const issues: string[] = [];
  for (const k of ["capabilities", "best_for", "not_for", "limitations"] as const) {
    if (src[k].length !== dst[k].length) issues.push(`${k}: ${src[k].length} items → ${dst[k].length}`);
  }
  const [s, d] = [flat(src), flat(dst)];
  s.forEach((text, i) => {
    if (d[i] !== undefined && !numbersPreserved(text, d[i])) issues.push(`numbers changed: "${text.slice(0, 60)}" → "${d[i].slice(0, 60)}"`);
  });
  if (d.some((t) => residualEnglish(t, [r.name]))) issues.push("untranslated English left");
  return issues;
}

async function review(src: ToolTranslation, dst: ToolTranslation): Promise<{ ok: boolean; issues: string[] }> {
  const prompt = `You are checking a ${LANG_NAME[lang]} translation of English directory copy. Be strict.
1. Back-translate each translated field into English and compare with the source: flag any added claim, dropped claim, changed number, or changed meaning.
2. Modal direction check, sentence by sentence: list each sentence containing obligation/permission wording in source or translation, with the source modal and the translated modal (${MODALS[lang]}). Flag any direction mismatch (e.g. "need not" translated as "must not").
Minor wording differences are fine; only flag meaning problems.

Source:
${JSON.stringify(src)}

Translation:
${JSON.stringify(dst)}

Reply with JSON only: {"modals":[{"source":"...","translation":"...","match":true}],"issues":["..."],"ok":true|false}`;
  const text = await openrouter(prompt, { maxTokens: 2000, temperature: 0 });
  try {
    const o = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? "{}");
    const modalBad = (o.modals ?? []).filter((m: { match?: boolean }) => m.match === false).map((m: { source: string; translation: string }) => `modal: "${m.source}" → "${m.translation}"`);
    const issues = [...(o.issues ?? []).map(String), ...modalBad];
    return { ok: o.ok === true && modalBad.length === 0, issues };
  } catch {
    return { ok: false, issues: ["reviewer reply not parseable"] };
  }
}

const rows = (await db.execute(only
  ? { sql: `SELECT id, name, tagline, description, intelligence FROM tools WHERE id IN (${only.map(() => "?").join(",")})`, args: only }
  : { sql: "SELECT id, name, tagline, description, intelligence FROM tools ORDER BY score DESC LIMIT ?", args: [top] })).rows as unknown as Row[];
const existing = new Map((await db.execute({ sql: "SELECT tool_id, source_hash, status FROM tool_i18n WHERE lang = ?", args: [lang] })).rows
  .filter((x) => !(retryFailed && x.status === "review_failed"))
  .map((x) => [String(x.tool_id), String(x.source_hash)]));

let done = 0, approved = 0, failed = 0;
async function one(r: Row) {
  const src = source(r);
  const hash = createHash("sha1").update(JSON.stringify(src)).digest("hex");
  if (existing.get(r.id) === hash) return;
  const dst = await translate(r, src).catch(() => null);
  if (!dst) { console.log(`skip ${r.id}: translator unavailable or unparseable`); return; }
  const issues = deterministic(r, src, dst);
  const rv = await review(src, dst).catch((e) => ({ ok: false, issues: [`review error: ${(e as Error).message}`] }));
  const ok = issues.length === 0 && rv.ok;
  const all = [...issues, ...rv.issues];
  ok ? approved++ : failed++;
  console.log(`${ok ? "OK  " : "FAIL"} ${r.id}: ${dst.tagline}${all.length ? `\n      ${all.join("\n      ")}` : ""}`);
  if (!dryRun) {
    await db.execute({
      sql: `INSERT INTO tool_i18n (tool_id, lang, content, status, issues, source_hash, updated_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(tool_id, lang) DO UPDATE SET content=excluded.content, status=excluded.status, issues=excluded.issues, source_hash=excluded.source_hash, human_reviewed=0, updated_at=excluded.updated_at`,
      args: [r.id, lang, JSON.stringify(dst), ok ? "approved" : "review_failed", all.join("\n"), hash],
    });
  }
  done++;
}

for (let i = 0; i < rows.length; i += 4) await Promise.all(rows.slice(i, i + 4).map(one));
console.log(`done=${done} approved=${approved} failed=${failed} sub2api=${llmStats.sub2api} openrouter=${llmStats.openrouter} ($${llmStats.openrouterUsd.toFixed(3)})`);
