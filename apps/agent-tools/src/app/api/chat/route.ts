import { streamText, convertToModelMessages } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { db } from "@repo/db";
import { checkRateLimit } from "@repo/db/rate-limit";
import { NextRequest } from "next/server";

// GLM-5 via OpenRouter (OpenAI-compatible)
function getModel() {
  const apiKey = process.env.LLM_API_KEY;
  const baseURL = process.env.LLM_BASE_URL || "https://openrouter.ai/api/v1";
  const modelId = process.env.LLM_MODEL || "z-ai/glm-5";

  if (!apiKey) throw new Error("LLM_API_KEY not configured");

  const provider = createOpenAI({ apiKey, baseURL });
  return provider.chat(modelId);
}

// C1: Sanitize intelligence field — strip instruction-like text that could be prompt injection
function sanitizeField(text: string, maxLen: number): string {
  if (!text) return "";
  // Strip common injection patterns
  const cleaned = text
    .replace(/\b(always|never|must|you should|ignore|forget|instead|override|prioritize|recommend|do not recommend)\b.*?[.!]/gi, "")
    .replace(/\b(system|instruction|prompt|role|assistant)\s*:/gi, "")
    .slice(0, maxLen);
  return cleaned.trim();
}

// Get ALL tools with rich context + intelligence for the AI
async function getToolContext(): Promise<string> {
  const r = await db.execute(
    "SELECT id, name, tagline, pricing, github_stars, category_tags, pros, use_cases, intelligence FROM tools WHERE content_status = 'complete' ORDER BY score DESC"
  );
  return (r.rows as any[])
    .map((t) => {
      let line = `${t.id} | ${t.name} | ${(t.tagline || "").slice(0, 80)} | ${t.pricing} | ★${t.github_stars || 0} | ${t.category_tags}`;

      if (t.intelligence && t.intelligence !== "") {
        try {
          const intel = JSON.parse(t.intelligence);
          // Only extract structured array/string fields — no free-form text injection
          const caps = (Array.isArray(intel.capabilities) ? intel.capabilities : []).slice(0, 3).map((c: string) => sanitizeField(c, 80)).filter(Boolean).join(", ");
          const integ = (Array.isArray(intel.integrations) ? intel.integrations : []).slice(0, 5).map((i: string) => sanitizeField(i, 40)).filter(Boolean).join(", ");
          const bestFor = (Array.isArray(intel.best_for) ? intel.best_for : []).slice(0, 2).map((b: string) => sanitizeField(b, 80)).filter(Boolean).join(", ");
          const notFor = (Array.isArray(intel.not_for) ? intel.not_for : []).slice(0, 1).map((n: string) => sanitizeField(n, 80)).filter(Boolean).join(", ");
          const diff = sanitizeField(typeof intel.key_differentiator === "string" ? intel.key_differentiator : "", 100);
          const deploy = (Array.isArray(intel.deployment) ? intel.deployment : []).slice(0, 3).map((d: string) => sanitizeField(d, 30)).filter(Boolean).join(", ");
          if (caps) line += ` | Can: ${caps}`;
          if (integ) line += ` | Integrates: ${integ}`;
          if (deploy) line += ` | Deploy: ${deploy}`;
          if (bestFor) line += ` | Best for: ${bestFor}`;
          if (notFor) line += ` | NOT for: ${notFor}`;
          if (diff) line += ` | Diff: ${diff}`;
        } catch {}
      } else {
        const pros = (() => { try { return JSON.parse(t.pros || "[]").slice(0, 2).map((p: string) => sanitizeField(p, 80)).join("; "); } catch { return ""; } })();
        const uses = (() => { try { return JSON.parse(t.use_cases || "[]").slice(0, 2).map((u: string) => sanitizeField(u, 80)).join("; "); } catch { return ""; } })();
        if (pros) line += ` | Pros: ${pros}`;
        if (uses) line += ` | Uses: ${uses}`;
      }

      return line;
    })
    .join("\n");
}

// Input budget limits
const MAX_MESSAGES = 10;
const MAX_MESSAGE_LENGTH = 2000;

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

CRITICAL: Do NOT output any headers or labels. No "PART 1", "Blueprint", "Execution Plan". Just write content naturally.

OUTPUT ORDER — Brief intro → JSON → Summary paragraph.

1. Write ONE short sentence introducing the blueprint. Then IMMEDIATELY output the JSON.

2. AFTER the JSON, write a summary paragraph (3-4 sentences, THIRD PERSON). Focus on what this system enables, what work it replaces, and why this combination is effective. Not "I built..." but "This blueprint enables..."

\`\`\`json
{
  "title": "Blueprint title",
  "icon": "emoji",
  "difficulty": "beginner|intermediate|advanced",
  "project_tags": ["side-project", "open-source"],
  "impact": {"build_time": "1-2 weekends", "monthly_cost": "$0-50", "replaces": "2 analysts"},
  "execution_plan": [
    {"step": "Step 1", "task": "What to do", "output": "What you'll have after this step", "tools_used": ["tool-id"]},
    {"step": "Step 2", "task": "...", "output": "...", "tools_used": ["tool-id"]}
  ],
  "failure_points": [
    "Specific risk #1 and how to mitigate it",
    "Specific risk #2 and how to mitigate it"
  ],
  "layers": [
    {
      "name": "Layer Name",
      "description": "What this layer does",
      "tools": [
        {"tool_id": "id-from-list", "role": "Primary", "note": "Why this tool"},
        {"tool_id": "id-from-list", "role": "Alternative", "note": "Why this tool"},
        {"tool_id": "shopify", "role": "External", "note": "Industry standard"}
      ]
    }
  ]
}
\`\`\`

FIELD GUIDELINES:
- project_tags: pick 2-3 from [side-project, startup-mvp, enterprise, open-source, low-cost, requires-dev, no-code, high-risk, proven-model]
- execution_plan: 4-7 concrete steps. Each step must have a tangible output. Reference actual tool names.
- failure_points: 2-4 SPECIFIC risks (not generic). "Your Shopify store will get suspended if product descriptions violate their TOS" not "be careful with compliance".
- impact: realistic estimates based on the specific scenario.

IMPORTANT:
- For tools from our AVAILABLE TOOLS list: tool_id MUST exactly match, role is "Primary" or "Alternative".
- For external/industry tools NOT in our list: use common name as tool_id, role MUST be "External".
- Do NOT output JSON in Phase 1 (discovery). Only in Phase 2.
- Do NOT write section headers or labels.`;

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

    // C2: Input budget control — prevent cost DoS
    if (messages.length > MAX_MESSAGES) {
      return Response.json({ error: "Too many messages. Start a new conversation." }, { status: 400 });
    }
    for (const msg of messages) {
      const text = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.parts || "");
      if (text.length > MAX_MESSAGE_LENGTH) {
        return Response.json({ error: "Message too long" }, { status: 400 });
      }
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
    });

    return result.toUIMessageStreamResponse();
  } catch (err: any) {
    console.error("Chat API error:", err);
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
