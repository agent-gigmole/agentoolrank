import { streamText, convertToModelMessages } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { NextRequest } from "next/server";

// Use DeepSeek (OpenAI-compatible) for now, will switch to AI Gateway later
function getModel() {
  const apiKey = process.env.LLM_API_KEY;
  const baseURL = process.env.LLM_BASE_URL || "https://api.deepseek.com";
  const modelId = process.env.LLM_MODEL || "deepseek-chat";

  if (!apiKey) throw new Error("LLM_API_KEY not configured");

  const provider = createOpenAI({ apiKey, baseURL });
  return provider.chat(modelId);
}

// Get top tools as context for the AI
async function getToolContext(): Promise<string> {
  const r = await db.execute(
    "SELECT id, name, tagline, pricing, github_stars, category_tags FROM tools WHERE content_status = 'complete' ORDER BY score DESC LIMIT 120"
  );
  return (r.rows as any[])
    .map(
      (t) =>
        `${t.id} | ${t.name} | ${(t.tagline || "").slice(0, 80)} | ${t.pricing} | ★${t.github_stars || 0} | ${t.category_tags}`
    )
    .join("\n");
}

// Get existing stacks for reference
async function getStackContext(): Promise<string> {
  const r = await db.execute(
    "SELECT slug, title, description FROM stacks ORDER BY slug LIMIT 36"
  );
  return (r.rows as any[])
    .map((s) => `${s.slug}: ${s.title} — ${(s.description || "").slice(0, 60)}`)
    .join("\n");
}

const SYSTEM_PROMPT = `You are an AI Agent Tools Architect for agentoolrank.com. You ONLY help users choose AI agent tools and build tool stacks.

BOUNDARY — STRICTLY ENFORCED:
- You ONLY discuss AI agent tools, tech stacks, and software architecture.
- If the user asks anything unrelated (chitchat, general knowledge, coding help, personal questions, news, jokes), reply BRIEFLY: "I'm an AI tools architect — I can only help you choose the right tools for building AI agent systems. What would you like to build?" Then stop.
- Do NOT answer off-topic questions even if you know the answer. Do NOT apologize excessively. One sentence redirect, done.
- Acceptable topics: tool selection, stack recommendations, tool comparisons, architecture advice, deployment strategies for AI systems.

WORKFLOW — TWO PHASES:

PHASE 1: DISCOVERY (first message from user)
When the user describes what they want to build, DO NOT immediately recommend a stack.
Instead, ask 3-5 short, specific clarifying questions to understand their needs. Questions should cover:
1. Technical context — What's your main language/framework? (Python, TypeScript, etc.)
2. Scale & deployment — Personal project, startup MVP, or enterprise production?
3. Budget — Open-source only, or willing to pay for managed services?
4. Key requirement — What's the #1 priority? (Speed to ship, scalability, cost, simplicity)
5. Existing stack — Any tools/services you're already using that this needs to integrate with?

Keep questions SHORT (one line each). Use numbered list. End with "Answer as many as you'd like — or just say 'surprise me' and I'll recommend based on best practices."

PHASE 2: RECOMMENDATION (after user answers, or if user says "surprise me" / gives enough context)
Now recommend the stack. Rules:
1. ONLY use tools from the AVAILABLE TOOLS list. Never invent tools.
2. Build a structured stack with 2-5 layers, each with 1-3 tools (Primary + Alternatives).
3. Explain WHY each tool fits THIS user's specific needs (reference their answers).
4. If the user asks to modify (cheaper, simpler, etc.), adjust accordingly.

ALWAYS respond in the SAME LANGUAGE the user writes in (Chinese → Chinese, English → English).

OUTPUT FORMAT (Phase 2 only):
First, write a personalized overview (2-3 sentences referencing their requirements).
Then output the stack as a JSON code block:

\`\`\`json
{
  "title": "Stack title",
  "icon": "emoji",
  "difficulty": "beginner|intermediate|advanced",
  "layers": [
    {
      "name": "Layer Name",
      "description": "What this layer does",
      "tools": [
        {"tool_id": "exact-id-from-list", "role": "Primary", "note": "Why this tool fits YOUR needs"},
        {"tool_id": "exact-id-from-list", "role": "Alternative", "note": "Why this tool"}
      ]
    }
  ]
}
\`\`\`

IMPORTANT: tool_id MUST exactly match an ID from the AVAILABLE TOOLS list.
Do NOT output JSON in Phase 1 (discovery questions). Only output JSON in Phase 2 (recommendation).`;

export async function POST(req: NextRequest) {
  try {
    // Rate limit by IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { ok, remaining } = checkRateLimit(ip);
    if (!ok) {
      return Response.json(
        { error: "Daily limit reached (20 requests). Come back tomorrow!" },
        { status: 429, headers: { "Retry-After": "86400" } }
      );
    }

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: "Invalid messages" }, { status: 400 });
    }

    const [toolContext, stackContext] = await Promise.all([
      getToolContext(),
      getStackContext(),
    ]);

    const systemMessage = `${SYSTEM_PROMPT}

AVAILABLE TOOLS (id | name | description | pricing | stars | categories):
${toolContext}

EXISTING STACKS (for reference — you can suggest these or create new ones):
${stackContext}`;

    const model = getModel();

    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
      model,
      system: systemMessage,
      messages: modelMessages,
      temperature: 0.3,
    });

    return result.toUIMessageStreamResponse();
  } catch (err: any) {
    console.error("Chat API error:", err);
    return Response.json(
      { error: err.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
