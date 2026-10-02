/**
 * Evaluate TypeSafe Jev against our human-reviewed labels from the 10-02/03 category audit:
 * scope (noul) on delisted out-of-scope tools vs confirmed in-scope tools, and primary category (choice).
 * Read-only. Usage: bun run scripts/eval-typesafe-scope.ts
 */
import { config } from "dotenv";
import { createClient } from "@libsql/client";
import { readFileSync } from "node:fs";

config({ path: new URL("../.env.local", import.meta.url).pathname, quiet: true });
const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });
const KEY = readFileSync(`${process.env.HOME}/.config/secrets/typesafe-api-key`, "utf8").trim();

const SCOPE = {
  type: "noul",
  instructions: "Should an AI agent tools directory list this project?",
  criteria: {
    true: "A tool for building, running, hosting or evaluating AI agents (agent frameworks, memory/RAG infrastructure, MCP servers, sandboxes, observability/evals, agent protocols, LLM gateways/tooling used by agents), or an agent that acts on its own (coding, browser, research, voice agents).",
    false: "A general chat client, a single-purpose AI app for end users (translation, transcription, note-taking, vertical consumer apps), a model or model-training/fine-tuning library, a course, paper list or prompt collection, or a general developer tool not specific to AI agents.",
  },
};

const cats = (await db.execute("SELECT slug, name, description FROM categories")).rows;
const CATEGORY = { type: "choice", instructions: "Which category of an AI agent tools directory fits this project best?", criteria: Object.fromEntries(cats.map((c) => [String(c.slug), `${c.name}: ${String(c.description ?? "").slice(0, 160)}`])) };

const archived = new Map((await db.execute("SELECT id, row_json, reason FROM tools_archive")).rows.map((r) => [String(r.id), { ...JSON.parse(String(r.row_json)).tool, reason: String(r.reason) }]));
const neg = [...archived.values()].filter((t: any) => /out of scope/.test(t.reason));
const csv = readFileSync(new URL("../data/category-audit-2026-10-02.csv", import.meta.url), "utf8").trim().split("\n").slice(1)
  .map((l) => l.match(/^([^,]+),"([^"]*)",([^,]*),(\d),(\w+),/)).filter(Boolean).map((m) => ({ id: m![1], judge: m![3], inOld: m![4], decision: m![5] }));
const reviewedPos = "babyagi-ui,astra-assistants-api,steel-browser,chatgdb,bloop,whodb,gpt-pilot,llama-hub,langchain-visualizer,jupyter-ai,go-openai,openllm,ai-website-cloner-template,oh-my-pi,minima,auto-evaluator,gptcache,quivr,faiss,openhuman,agent,pezzo,langchaingo,taskingai,autonomous-hr-chatbot,gpteam,llm-chain,react-agent,developer,audiogpt,autogpt-js,langstream,llama-agents,vision-agent".split(",");
const agree = csv.filter((r) => r.decision === "approve" && r.inOld === "1" && !reviewedPos.includes(r.id));
let seed = 11; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
const posIds = [...reviewedPos, ...agree.sort(() => rnd() - 0.5).slice(0, 40).map((r) => r.id)];
const judgeCat = new Map(csv.map((r) => [r.id, r.judge]));

async function ask(t: any) {
  const state = { name: t.name, tagline: t.tagline, description: String(t.description ?? "").slice(0, 1200), github: t.github_url };
  const t0 = Date.now();
  const res = await fetch("https://api.typesafe.ai/v1/systemone", {
    method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ state, model: "jev-latest", questions: { scope: SCOPE, category: CATEGORY } }),
  });
  const j = await res.json() as any;
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(j).slice(0, 200)}`);
  return { ms: Date.now() - t0, j };
}

const rows: { id: string; label: 0 | 1; p: number; cat?: string; judge?: string }[] = [];
const pos = (await db.execute(`SELECT * FROM tools WHERE id IN (${posIds.map(() => "?").join(",")})`, posIds)).rows;
let first = true, ms = 0;
for (const [label, list] of [[1, pos], [0, neg]] as const) for (const t of list as any[]) {
  const { ms: m, j } = await ask(t); ms += m;
  if (first) { console.log("sample response:", JSON.stringify(j).slice(0, 600)); first = false; }
  const a = j.answers ?? j;
  rows.push({ id: t.id, label, p: Number(a.scope?.noul), cat: a.category?.choice, judge: judgeCat.get(t.id) });
}
console.log(`n=${rows.length} pos=${pos.length} neg=${neg.length} avg_ms=${Math.round(ms / rows.length)}`);
for (const th of [0.3, 0.4, 0.5, 0.6, 0.7, 0.8]) {
  const tp = rows.filter((r) => r.label && r.p >= th).length, fn = rows.filter((r) => r.label && r.p < th).length;
  const tn = rows.filter((r) => !r.label && r.p < th).length, fp = rows.filter((r) => !r.label && r.p >= th).length;
  console.log(`th=${th} acc=${((tp + tn) / rows.length).toFixed(3)} keep_pos=${tp}/${tp + fn} drop_neg=${tn}/${tn + fp}`);
}
const withCat = rows.filter((r) => r.label && r.judge);
console.log(`category agreement with reviewed judge category: ${withCat.filter((r) => r.cat === r.judge).length}/${withCat.length}`);
console.log("misses:", rows.filter((r) => (r.label && r.p < 0.5) || (!r.label && r.p >= 0.5)).map((r) => `${r.id}:${r.label}:${r.p.toFixed(2)}`).join(" "));
