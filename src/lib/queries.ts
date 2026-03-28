import { type InValue } from "@libsql/client";
import { db } from "./db";
import { ToolSchema, CategorySchema, type Tool, type Category } from "./schema";

function parseJsonFields(row: Record<string, unknown>): Record<string, unknown> {
  const jsonFields = [
    "category_tags", "industry_tags", "pros", "cons",
    "use_cases", "related_tools", "alternatives", "integrations",
  ];
  const result = { ...row };
  for (const field of jsonFields) {
    if (typeof result[field] === "string") {
      try {
        result[field] = JSON.parse(result[field] as string);
      } catch {
        result[field] = [];
      }
    }
  }
  return result;
}

export async function getTools(options?: {
  category?: string;
  limit?: number;
  offset?: number;
  sort?: "score" | "stars" | "new" | "velocity";
}): Promise<Tool[]> {
  const { category, limit = 50, offset = 0, sort = "score" } = options ?? {};

  const orderBy = {
    score: "score DESC",
    stars: "github_stars DESC NULLS LAST",
    new: "created_at DESC",
    velocity: "star_velocity_30d DESC NULLS LAST",
  }[sort];

  let sql = "SELECT * FROM tools";
  const args: InValue[] = [];

  if (category) {
    sql += " WHERE category_tags LIKE ?";
    args.push(`%"${category}"%`);
  }

  sql += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
  args.push(limit, offset);

  const result = await db.execute({ sql, args });
  return result.rows.map((row) => {
    const parsed = parseJsonFields(row as Record<string, unknown>);
    return ToolSchema.parse(parsed);
  });
}

export async function getToolBySlug(slug: string): Promise<Tool | null> {
  const result = await db.execute({
    sql: "SELECT * FROM tools WHERE id = ?",
    args: [slug],
  });
  if (result.rows.length === 0) return null;
  const parsed = parseJsonFields(result.rows[0] as Record<string, unknown>);
  return ToolSchema.parse(parsed);
}

export async function getCategories(): Promise<Category[]> {
  const result = await db.execute(
    "SELECT c.*, (SELECT COUNT(*) FROM tools t WHERE t.category_tags LIKE '%\"' || c.slug || '\"%') as tool_count FROM categories c ORDER BY tool_count DESC"
  );
  return result.rows.map((row) => CategorySchema.parse(row));
}

export async function getNewTools(days: number = 7, limit: number = 20): Promise<Tool[]> {
  const result = await db.execute({
    sql: `SELECT * FROM tools WHERE created_at >= datetime('now', '-' || ? || ' days') ORDER BY created_at DESC LIMIT ?`,
    args: [days, limit],
  });
  return result.rows.map((row) => {
    const parsed = parseJsonFields(row as Record<string, unknown>);
    return ToolSchema.parse(parsed);
  });
}

export async function getToolCount(): Promise<number> {
  const result = await db.execute("SELECT COUNT(*) as count FROM tools");
  return result.rows[0].count as number;
}

export async function getLastRefreshTime(): Promise<string | null> {
  const result = await db.execute(
    "SELECT MAX(data_refreshed_at) as last_refresh FROM tools"
  );
  return (result.rows[0]?.last_refresh as string) ?? null;
}

/**
 * Generate comparison pairs from top tools in each category.
 * Returns sorted pairs like ["langchain-vs-dify", ...] for sitemap + comparison index.
 */
export async function getComparisonPairs(topN: number = 8): Promise<Array<{ slugA: string; slugB: string; nameA: string; nameB: string; category: string }>> {
  const categories = await db.execute("SELECT slug FROM categories");
  const pairs: Array<{ slugA: string; slugB: string; nameA: string; nameB: string; category: string }> = [];
  const seen = new Set<string>();

  for (const cat of categories.rows) {
    const slug = (cat as unknown as { slug: string }).slug;
    const tools = await db.execute({
      sql: `SELECT id, name FROM tools WHERE category_tags LIKE ? AND content_status = 'complete' ORDER BY score DESC LIMIT ?`,
      args: [`%"${slug}"%`, topN],
    });

    const toolList = tools.rows as unknown as Array<{ id: string; name: string }>;
    // Generate pairs from top tools (i vs j where i < j)
    for (let i = 0; i < toolList.length; i++) {
      for (let j = i + 1; j < toolList.length; j++) {
        // Alphabetical order for consistent URLs
        const [a, b] = toolList[i].id < toolList[j].id
          ? [toolList[i], toolList[j]]
          : [toolList[j], toolList[i]];
        const key = `${a.id}-vs-${b.id}`;
        if (!seen.has(key)) {
          seen.add(key);
          pairs.push({ slugA: a.id, slugB: b.id, nameA: a.name, nameB: b.name, category: slug });
        }
      }
    }
  }

  return pairs;
}

/**
 * Get metric snapshots for a tool (for trend chart).
 * Returns daily star counts ordered by date.
 */
export async function getToolSnapshots(toolId: string): Promise<Array<{ date: string; stars: number }>> {
  const result = await db.execute({
    sql: "SELECT date, github_stars FROM metric_snapshots WHERE tool_id = ? ORDER BY date ASC",
    args: [toolId],
  });
  return result.rows.map((r) => ({
    date: (r as unknown as { date: string }).date,
    stars: (r as unknown as { github_stars: number }).github_stars,
  }));
}

/**
 * Get trending tools (highest star velocity) for weekly digest.
 */
export async function getTrendingTools(limit: number = 10): Promise<Tool[]> {
  const result = await db.execute({
    sql: "SELECT * FROM tools WHERE star_velocity_30d IS NOT NULL AND content_status = 'complete' ORDER BY star_velocity_30d DESC LIMIT ?",
    args: [limit],
  });
  return result.rows.map((row) => {
    const parsed = parseJsonFields(row as Record<string, unknown>);
    return ToolSchema.parse(parsed);
  });
}

/**
 * Get subscriber count for display.
 */
export async function getSubscriberCount(): Promise<number> {
  try {
    const result = await db.execute("SELECT COUNT(*) as count FROM subscribers");
    return (result.rows[0] as unknown as { count: number }).count;
  } catch {
    return 0;
  }
}

export async function searchTools(query: string, limit: number = 20): Promise<Tool[]> {
  const result = await db.execute({
    sql: `SELECT * FROM tools WHERE name LIKE ? OR tagline LIKE ? OR description LIKE ? ORDER BY score DESC LIMIT ?`,
    args: [`%${query}%`, `%${query}%`, `%${query}%`, limit],
  });
  return result.rows.map((row) => {
    const parsed = parseJsonFields(row as Record<string, unknown>);
    return ToolSchema.parse(parsed);
  });
}
