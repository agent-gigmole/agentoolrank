import { db } from "@/lib/db";
import { NextRequest } from "next/server";

// Quick fuzzy search — returns tools + stacks matching the query
// Uses expanded keyword matching with category and use-case awareness
const QUERY_EXPANSIONS: Record<string, string[]> = {
  // Chinese → English expansions for common AI scenarios
  "金融": ["finance", "trading", "quant", "fintech"],
  "量化": ["quantitative", "trading", "backtest", "quant"],
  "交易": ["trading", "exchange", "broker"],
  "客服": ["customer", "service", "support", "chatbot"],
  "聊天": ["chat", "chatbot", "conversation"],
  "代码": ["code", "coding", "developer", "programming"],
  "审查": ["review", "audit", "analysis"],
  "写作": ["writing", "content", "copywriting"],
  "搜索": ["search", "retrieval", "rag"],
  "监控": ["monitoring", "observability", "alert"],
  "安全": ["security", "vulnerability", "threat"],
  "教育": ["education", "tutoring", "learning"],
  "医疗": ["medical", "health", "clinical"],
  "法律": ["legal", "contract", "compliance"],
  "电商": ["ecommerce", "commerce", "shopping", "product"],
  "推荐": ["recommendation", "suggest"],
  "翻译": ["translation", "multilingual", "language"],
  "图片": ["image", "vision", "visual"],
  "语音": ["voice", "speech", "audio"],
  "数据": ["data", "analytics", "database"],
  "自动化": ["automation", "workflow", "pipeline"],
  "多模态": ["multimodal", "multi-modal"],
  "agent": ["agent", "autonomous", "agentic"],
  "rag": ["rag", "retrieval", "augmented", "vector"],
  "chatbot": ["chatbot", "chat", "conversation", "assistant"],
};

function expandQuery(query: string): string[] {
  const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 1);
  const expanded = new Set(words);

  for (const word of words) {
    // Check direct expansions
    if (QUERY_EXPANSIONS[word]) {
      for (const exp of QUERY_EXPANSIONS[word]) expanded.add(exp);
    }
    // Check partial matches in expansion keys
    for (const [key, values] of Object.entries(QUERY_EXPANSIONS)) {
      if (word.includes(key) || key.includes(word)) {
        for (const v of values) expanded.add(v);
      }
    }
  }

  return Array.from(expanded);
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return Response.json({ tools: [], stacks: [] });
  }

  const keywords = expandQuery(q);
  const likePatterns = keywords.map((k) => `%${k}%`);

  // Search tools
  const toolConditions = likePatterns.map(
    () => "(name LIKE ? OR tagline LIKE ? OR description LIKE ? OR category_tags LIKE ? OR use_cases LIKE ?)"
  );
  const toolArgs: Array<string | number> = [];
  for (const p of likePatterns) {
    toolArgs.push(p, p, p, p, p);
  }
  toolArgs.push(12);

  const toolSql = toolConditions.length > 0
    ? `SELECT id, name, tagline, pricing, github_stars, category_tags FROM tools WHERE content_status = 'complete' AND (${toolConditions.join(" OR ")}) ORDER BY score DESC LIMIT ?`
    : `SELECT id, name, tagline, pricing, github_stars, category_tags FROM tools WHERE content_status = 'complete' ORDER BY score DESC LIMIT ?`;

  // Search stacks
  const stackConditions = likePatterns.map(
    () => "(title LIKE ? OR description LIKE ? OR layers LIKE ? OR tags LIKE ?)"
  );
  const stackArgs: Array<string | number> = [];
  for (const p of likePatterns) {
    stackArgs.push(p, p, p, p);
  }
  stackArgs.push(5);

  const stackSql = stackConditions.length > 0
    ? `SELECT slug, title, description, icon, difficulty FROM stacks WHERE ${stackConditions.join(" OR ")} ORDER BY slug LIMIT ?`
    : `SELECT slug, title, description, icon, difficulty FROM stacks ORDER BY slug LIMIT ?`;

  const [toolResult, stackResult] = await Promise.all([
    db.execute({ sql: toolSql, args: toolArgs }),
    db.execute({ sql: stackSql, args: stackArgs }),
  ]);

  return Response.json({
    tools: toolResult.rows,
    stacks: stackResult.rows,
    expandedKeywords: keywords,
  });
}
