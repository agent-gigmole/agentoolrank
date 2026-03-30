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

// Get ALL tools with rich context for the AI
async function getToolContext(): Promise<string> {
  const r = await db.execute(
    "SELECT id, name, tagline, description, pricing, github_stars, category_tags, pros, use_cases FROM tools WHERE content_status = 'complete' ORDER BY score DESC"
  );
  return (r.rows as any[])
    .map((t) => {
      const pros = (() => { try { const p = JSON.parse(t.pros || "[]"); return p.slice(0, 2).join("; "); } catch { return ""; } })();
      const uses = (() => { try { const u = JSON.parse(t.use_cases || "[]"); return u.slice(0, 2).join("; "); } catch { return ""; } })();
      return `${t.id} | ${t.name} | ${(t.tagline || "").slice(0, 100)} | ${t.pricing} | ★${t.github_stars || 0} | ${t.category_tags}${pros ? ` | Pros: ${pros}` : ""}${uses ? ` | Uses: ${uses}` : ""}`;
    })
    .join("\n");
}

// Get valid tool IDs for validation
async function getValidToolIds(): Promise<Set<string>> {
  const r = await db.execute("SELECT id FROM tools WHERE content_status = 'complete'");
  return new Set((r.rows as any[]).map((t) => t.id));
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
Instead, ask 3-5 clarifying questions that are SPECIFIC TO THEIR SCENARIO.

CRITICAL: Do NOT ask the same generic questions every time. Analyze what the user said and ask questions that would actually change the recommendation. Examples:
- If they say "量化交易": ask about data source (A股/美股/crypto?), execution speed requirements, backtesting needs
- If they say "customer service bot": ask about channels (web/WhatsApp/phone?), expected volume, need for human handoff
- If they say "RAG chatbot": ask about document types (PDF/code/web?), knowledge base size, accuracy requirements
- If they say "code reviewer": ask about languages, CI/CD integration, team size

Always include ONE question about scale/budget and ONE about existing tools. The other 2-3 questions should be domain-specific and demonstrate expertise in their problem space.

Keep questions SHORT (one line each). Use numbered list. End with a note that they can answer any subset or say "surprise me".

PHASE 2: RECOMMENDATION (after user answers, or if user says "surprise me" / gives enough context)

THINK STEP BY STEP before recommending:
Step A: What is the COMPLETE system the user needs? Not just the AI parts — the whole picture.
Step B: What are the core business layers? (e.g. for e-commerce: orders/payments/inventory FIRST, then AI on top)
Step C: Where does AI add value vs where do established non-AI tools belong?
Step D: Where must humans stay in the loop?

Now recommend the stack. Rules:
1. Use tools from the AVAILABLE TOOLS list when they fit. But DO NOT force AI-only solutions.
2. For layers where industry-standard non-AI tools are essential (databases, payment, CMS, analytics, ERP), recommend those by name even if they're not in our list. Mark them with role: "External" in the JSON.
3. Build a REALISTIC stack with 4-7 layers that covers the FULL system, not just the AI parts.
4. Include a "Human Review" or "Operations" layer when the scenario involves risk (financial, legal, customer-facing content, compliance).
5. Each layer should have 1-3 tools (Primary + Alternatives).
6. Explain WHY each tool fits THIS user's specific needs.
7. If the user asks to modify (cheaper, simpler, etc.), adjust accordingly.

COMMON MISTAKE TO AVOID: Do NOT build a stack that is 100% AI tools. Real systems need databases, payment processors, analytics, APIs, and human oversight. A "quantitative trading system" needs a broker API and market data feed, not just LangChain + Qdrant. An "e-commerce automation" needs Shopify/WooCommerce + Stripe + GA4, with AI layered on top.

ALWAYS respond in the SAME LANGUAGE the user writes in (Chinese → Chinese, English → English).

OUTPUT FORMAT (Phase 2 only):

CRITICAL: Do NOT output any headers or labels like "PART 1", "User Story", "Impact", "Stack JSON", "Here is the stack". Just write content naturally.

OUTPUT ORDER — Stack FIRST, then Story:

1. First, write ONE short sentence introducing the recommendation (e.g. "Based on your requirements, here's a stack for..."). Then IMMEDIATELY output the JSON code block.

2. AFTER the JSON block, write the user story paragraph (3-4 sentences, THIRD PERSON). Focus on business value:
- What problem this solves and what becomes possible
- How much manual work/cost it eliminates (specific numbers)
- How easy it is to set up
- Why this specific combination works well together
Write as a product brief. Not "I built..." but "This system enables..."

\`\`\`json
{
  "title": "Stack title",
  "icon": "emoji",
  "difficulty": "beginner|intermediate|advanced",
  "story": "Copy the summary paragraph here",
  "impact": {"build_time": "1-2 weekends", "monthly_cost": "$0-50", "replaces": "2 analysts"},
  "layers": [
    {
      "name": "Layer Name",
      "description": "What this layer does",
      "tools": [
        {"tool_id": "id-from-available-list", "role": "Primary", "note": "Why this tool"},
        {"tool_id": "id-from-available-list", "role": "Alternative", "note": "Why this tool"},
        {"tool_id": "shopify", "role": "External", "note": "Industry standard e-commerce platform"}
      ]
    }
  ]
}
\`\`\`

IMPORTANT:
- For tools from our AVAILABLE TOOLS list: tool_id MUST exactly match, role is "Primary" or "Alternative".
- For external/industry tools NOT in our list (Shopify, Stripe, PostgreSQL, GA4, etc.): use their common name as tool_id, role MUST be "External".
- Do NOT output JSON in Phase 1 (discovery questions). Only output JSON in Phase 2 (recommendation).
- Do NOT write section headers or labels — just a brief intro, then JSON, then story.`;

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

    const [toolContext, stackContext, validIds] = await Promise.all([
      getToolContext(),
      getStackContext(),
      getValidToolIds(),
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
