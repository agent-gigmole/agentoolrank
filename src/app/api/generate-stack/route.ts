import { db } from "@/lib/db";
import { searchStacks } from "@/lib/queries";
import { NextRequest } from "next/server";

const LLM_API_KEY = process.env.LLM_API_KEY; // DeepSeek or any OpenAI-compatible
const LLM_BASE_URL = process.env.LLM_BASE_URL || "https://api.deepseek.com";
const LLM_MODEL = process.env.LLM_MODEL || "deepseek-chat";

interface StackLayer {
  name: string;
  description: string;
  tools: Array<{ tool_id: string; role: string; note: string }>;
}

async function getToolList(): Promise<string> {
  const r = await db.execute(
    "SELECT id, name, tagline FROM tools WHERE content_status = 'complete' ORDER BY score DESC LIMIT 100"
  );
  return (r.rows as any[])
    .map((t) => `${t.id}: ${t.name} — ${(t.tagline || "").slice(0, 60)}`)
    .join("\n");
}

async function generateWithLLM(query: string, toolList: string, apiKey: string, baseUrl: string, model: string): Promise<{
  slug: string;
  title: string;
  description: string;
  icon: string;
  difficulty: string;
  layers: StackLayer[];
} | null> {
  if (!LLM_API_KEY) return null;

  const prompt = `You are an AI agent tools expert. A user wants to: "${query}"

AVAILABLE TOOLS (id: name — description):
${toolList}

Generate a tool stack recommendation as JSON. Use ONLY tool_ids from the list.
Each layer should have 1-3 tools (Primary + Alternatives), 2-5 layers total.

{
  "slug": "url-friendly-slug",
  "title": "Short title for this stack",
  "description": "1-2 sentence overview",
  "icon": "emoji",
  "difficulty": "beginner|intermediate|advanced",
  "layers": [
    {
      "name": "Layer Name",
      "description": "What this layer does",
      "tools": [{"tool_id": "id-from-list", "role": "Primary", "note": "Why this tool"}]
    }
  ]
}

Return ONLY valid JSON.`;

  try {
    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      console.error(`LLM API ${res.status}: ${await res.text()}`);
      return null;
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    // Strip markdown fences if present
    const cleaned = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in LLM response:", text.slice(0, 200));
      return null;
    }

    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error("LLM generation error:", err);
    return null;
  }
}

export async function GET() {
  const hasKey = !!(process.env.LLM_API_KEY);
  const baseUrl = process.env.LLM_BASE_URL || "not set";
  const model = process.env.LLM_MODEL || "not set";
  return Response.json({ hasKey, baseUrl, model });
}

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== "string" || query.length > 500) {
      return Response.json({ error: "Invalid query" }, { status: 400 });
    }

    // Re-read env at runtime (Vercel may set after module load)
    const apiKey = process.env.LLM_API_KEY || LLM_API_KEY;
    const baseUrl = process.env.LLM_BASE_URL || LLM_BASE_URL;
    const model = process.env.LLM_MODEL || LLM_MODEL;

    // Step 1: Check cache (existing stacks)
    const cached = await searchStacks(query, 3);
    if (cached.length > 0) {
      return Response.json({ source: "cache", stacks: cached });
    }

    // Step 2: Generate with LLM (if API key configured)
    if (!apiKey || apiKey === "undefined") {
      return Response.json({
        source: "none",
        message: "No matching stacks found. LLM generation not configured.",
        stacks: [],
      });
    }

    const toolList = await getToolList();
    const generated = await generateWithLLM(query, toolList, apiKey, baseUrl, model);

    if (!generated || !generated.layers) {
      return Response.json({
        source: "none",
        message: "Could not generate a stack for this query.",
        stacks: [],
      });
    }

    // Step 3: Try to cache (may fail on read-only DB like Vercel)
    try {
      const now = new Date().toISOString();
      await db.execute({
        sql: `INSERT OR IGNORE INTO stacks (slug, title, description, icon, difficulty, layers, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          generated.slug,
          generated.title,
          generated.description || "",
          generated.icon || "🔧",
          generated.difficulty || "intermediate",
          JSON.stringify(generated.layers),
          now, now,
        ],
      });
    } catch {
      // Read-only DB on Vercel — skip caching, still return result
    }

    return Response.json({
      source: "generated",
      stacks: [{
        slug: generated.slug,
        title: generated.title,
        description: generated.description,
        icon: generated.icon,
        difficulty: generated.difficulty,
        layers: generated.layers,
      }],
    });
  } catch (err) {
    console.error("Generate stack error:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
