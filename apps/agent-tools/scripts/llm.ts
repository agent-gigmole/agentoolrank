/**
 * Shared LLM call for batch scripts. Primary: the local Sub2API gateway (owner decision #9,
 * agentkit BOSS_DECISIONS) — model gpt-5.6-sol (gpt-5.4/5.2/mini are plan-gated there).
 * Fallback: OpenRouter (LLM_BASE_URL/LLM_API_KEY in .env.local) so a gateway outage doesn't stop jobs.
 */
import { existsSync, readFileSync } from "node:fs";

const SUB2API_URL = process.env.SUB2API_BASE_URL || "http://localhost:8080/v1";
const SUB2API_MODEL = process.env.SUB2API_MODEL || "gpt-5.6-sol";
const SUB2API_KEY_FILE = `${process.env.HOME}/.config/secrets/sub2api-openai-key`;
const OPENROUTER_MODEL = "deepseek/deepseek-v3.2";

export const llmStats = { sub2api: 0, openrouter: 0, openrouterUsd: 0 };

async function call(base: string, key: string, model: string, prompt: string, maxTokens: number, temperature: number) {
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], max_tokens: maxTokens, temperature }),
    signal: AbortSignal.timeout(180000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error(`${model} ${res.status}: ${JSON.stringify(data.error ?? {}).slice(0, 160)}`);
  return { text: String(data.choices?.[0]?.message?.content ?? ""), usage: data.usage ?? {} };
}

export async function llm(prompt: string, opts: { maxTokens?: number; temperature?: number } = {}): Promise<string> {
  const maxTokens = opts.maxTokens ?? 1200, temperature = opts.temperature ?? 0.1;
  if (existsSync(SUB2API_KEY_FILE)) {
    try {
      const r = await call(SUB2API_URL, readFileSync(SUB2API_KEY_FILE, "utf8").trim(), SUB2API_MODEL, prompt, maxTokens, temperature);
      if (r.text.trim()) {
        llmStats.sub2api++;
        return r.text;
      }
    } catch (e) {
      console.error(`sub2api failed, falling back to OpenRouter: ${(e as Error).message}`);
    }
  }
  const r = await call(process.env.LLM_BASE_URL!, process.env.LLM_API_KEY!, OPENROUTER_MODEL, prompt, maxTokens, temperature);
  llmStats.openrouter++;
  llmStats.openrouterUsd += (r.usage.prompt_tokens ?? 0) * 0.28e-6 + (r.usage.completion_tokens ?? 0) * 0.42e-6;
  return r.text;
}
