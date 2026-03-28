import { streamText, convertToModelMessages } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { db } from "@/lib/db";
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

const SYSTEM_PROMPT = `You are an AI Agent Tools Architect for agentoolrank.com. You help users build AI agent systems by recommending the right tool stack.

RULES:
1. ONLY recommend tools from the AVAILABLE TOOLS list below. Never invent tools.
2. Each recommendation must be a structured stack with 2-5 layers.
3. Each layer has a name, description, and 1-3 tools (Primary + Alternatives).
4. Be concise but helpful. Explain WHY each tool fits.
5. If the user asks to modify the stack (cheaper, simpler, etc.), adjust accordingly.
6. Respond in the SAME LANGUAGE the user writes in (Chinese → Chinese, English → English).
7. Always output a JSON block with the stack structure at the END of your response.

OUTPUT FORMAT:
First, write a brief natural language overview (2-3 sentences).
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
        {"tool_id": "exact-id-from-list", "role": "Primary", "note": "Why this tool"},
        {"tool_id": "exact-id-from-list", "role": "Alternative", "note": "Why this tool"}
      ]
    }
  ]
}
\`\`\`

IMPORTANT: tool_id MUST exactly match an ID from the AVAILABLE TOOLS list.`;

export async function POST(req: NextRequest) {
  try {
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
