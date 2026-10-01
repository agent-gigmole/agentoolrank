// Shared by review-submissions.ts and expand-tools.ts: fetch evidence and ask the LLM for a verdict.
import { parseReview, type Review } from "../src/lib/review";
import { llm, llmStats } from "./llm";

export const MODEL = "deepseek/deepseek-v3.2";
export let spentUsd = 0;
const PRICE_IN = 0.28 / 1e6, PRICE_OUT = 0.42 / 1e6;

export async function fetchText(url: string, max = 3000): Promise<{ html: string; text: string }> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "AgentoolRank-Review/1.0 (+https://agentoolrank.com/submit)" }, signal: AbortSignal.timeout(15000) });
    const html = await res.text();
    const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return { html, text: text.slice(0, max) };
  } catch {
    return { html: "", text: "" };
  }
}

export async function readme(githubUrl: string | null): Promise<string> {
  const m = githubUrl?.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!m) return "";
  return (await fetchText(`https://raw.githubusercontent.com/${m[1]}/${m[2]}/HEAD/README.md`, 3000)).text;
}

export async function judge(name: string, url: string, tagline: string, site: string, rd: string, categories: Array<{ slug: string; name: string }>): Promise<Review | null> {
  const prompt = `You review submissions to AgentoolRank, a directory of tools for BUILDING, RUNNING or EVALUATING AI agents (agent frameworks, coding agents, memory/RAG, tool integration/MCP, browser agents, sandboxes, observability/evals, voice agents, no-code agent builders, agent platforms).

Approve only if the product is such a tool. Reject: generic AI apps for end users (AI writers, chatbots for customers, image generators), non-AI products, content farms, broken or placeholder sites. Base every field ONLY on the evidence below; don't invent features.

Submission: ${name} — ${tagline} (${url})
Website text: ${site || "(could not fetch)"}
README: ${rd || "(none)"}

Categories (use the slug): ${categories.map((c) => `${c.slug} (${c.name})`).join(", ")}

Reply with JSON only:
{"decision":"approve"|"reject","reason":"one sentence","category":"<slug>","tagline":"<=120 chars","description":"2-3 factual sentences","pricing":"free"|"freemium"|"paid"|"open-source",
 "intelligence":{"capabilities":["..."],"integrations":["..."],"best_for":["..."],"not_for":["..."],"limitations":["..."],"key_differentiator":"one sentence"}}`;
  const text = await llm(prompt, { maxTokens: 1200, temperature: 0.1 });
  spentUsd = llmStats.openrouterUsd;
  return parseReview(text, categories.map((c) => c.slug));
}

