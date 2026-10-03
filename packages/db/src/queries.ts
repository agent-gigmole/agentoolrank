import { type InValue } from "@libsql/client";
import { db } from "./index";
import { ToolSchema, CategorySchema, type Tool, type Category } from "./schema";

/** Parse many tool rows; a single malformed row is logged and skipped instead of failing the page/build. */
function parseTools(rows: unknown[]): Tool[] {
  const out: Tool[] = [];
  for (const row of rows) {
    const r = ToolSchema.safeParse(parseJsonFields(row as Record<string, unknown>));
    if (r.success) out.push(r.data);
    else console.warn(`skipping invalid tool row ${(row as { id?: string }).id}: ${r.error.issues.map((i) => i.path.join(".")).join(", ")}`);
  }
  return out;
}

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
  return parseTools(result.rows);
}

export async function getToolBySlug(slug: string): Promise<Tool | null> {
  const result = await db.execute({
    sql: "SELECT * FROM tools WHERE id = ?",
    args: [slug],
  });
  if (result.rows.length === 0) return null;
  return parseTools([result.rows[0]])[0] ?? null;
}

export async function getCategories(): Promise<Category[]> {
  const result = await db.execute(
    // Explicit columns: categories also has a stored (stale) tool_count column, and c.* would shadow the live count.
    "SELECT c.slug, c.name, c.description, c.icon, (SELECT COUNT(*) FROM tools t WHERE t.category_tags LIKE '%\"' || c.slug || '\"%') as tool_count FROM categories c ORDER BY tool_count DESC"
  );
  return result.rows.map((row) => CategorySchema.parse(row));
}

export async function getNewTools(days: number = 7, limit: number = 20): Promise<Tool[]> {
  const result = await db.execute({
    sql: `SELECT * FROM tools WHERE created_at >= datetime('now', '-' || ? || ' days') ORDER BY created_at DESC LIMIT ?`,
    args: [days, limit],
  });
  return parseTools(result.rows);
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
  return parseTools(result.rows);
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

/**
 * Stack Graph types and queries.
 */
export interface StackTool {
  tool_id: string;
  role: string;
  note: string;
}

export interface StackLayer {
  name: string;
  description: string;
  tools: StackTool[];
}

export interface Stack {
  slug: string;
  title: string;
  description: string;
  icon: string;
  difficulty: string;
  layers: StackLayer[];
}

export async function getStacks(): Promise<Stack[]> {
  const result = await db.execute("SELECT * FROM stacks ORDER BY slug");
  return result.rows.map((row) => {
    const r = row as unknown as { slug: string; title: string; description: string; icon: string; difficulty: string; layers: string };
    return { ...r, layers: JSON.parse(r.layers) };
  });
}

export async function getStackBySlug(slug: string): Promise<Stack | null> {
  const result = await db.execute({ sql: "SELECT * FROM stacks WHERE slug = ?", args: [slug] });
  if (result.rows.length === 0) return null;
  const r = result.rows[0] as unknown as { slug: string; title: string; description: string; icon: string; difficulty: string; layers: string };
  return { ...r, layers: JSON.parse(r.layers) };
}

export async function searchTools(query: string, limit: number = 20): Promise<Tool[]> {
  // Rank by how many query keywords match (name/tagline weigh most), then by overall score.
  const stop = new Set(["ai", "the", "for", "and", "with", "tool", "tools", "open", "source"]);
  const keywords = query.toLowerCase().split(/[^a-z0-9.+#-]+/).filter((k) => k.length > 1 && !stop.has(k)).slice(0, 8);
  if (keywords.length === 0) {
    const result = await db.execute({ sql: "SELECT * FROM tools ORDER BY score DESC LIMIT ?", args: [limit] });
    return parseTools(result.rows);
  }

  const parts: string[] = [];
  const args: Array<string | number> = [];
  for (const k of keywords) {
    const p = `%${k}%`;
    parts.push(
      "(CASE WHEN lower(name) LIKE ? THEN 4 ELSE 0 END + CASE WHEN lower(tagline) LIKE ? THEN 3 ELSE 0 END" +
        " + CASE WHEN category_tags LIKE ? THEN 3 ELSE 0 END + CASE WHEN lower(description) LIKE ? THEN 1 ELSE 0 END" +
        " + CASE WHEN lower(intelligence) LIKE ? THEN 1 ELSE 0 END)",
    );
    args.push(p, p, p, p, p);
  }
  args.push(limit);
  const sql = `SELECT * FROM (SELECT *, (${parts.join(" + ")}) AS match_score FROM tools) WHERE match_score > 0 ORDER BY match_score DESC, score DESC LIMIT ?`;
  const result = await db.execute({ sql, args });
  return parseTools(result.rows);
}

/**
 * Search stacks by query (title, description, tags, layer names).
 */
export async function searchStacks(query: string, limit: number = 10): Promise<Stack[]> {
  const keywords = query.toLowerCase().split(/\s+/).filter((k) => k.length > 1);
  const likePatterns = keywords.map((k) => `%${k}%`);

  const conditions = likePatterns.map(
    () => "(title LIKE ? OR description LIKE ? OR layers LIKE ?)"
  );
  const args: Array<string | number> = [];
  for (const p of likePatterns) {
    args.push(p, p, p);
  }
  args.push(limit);

  const sql = conditions.length > 0
    ? `SELECT * FROM stacks WHERE ${conditions.join(" OR ")} ORDER BY slug LIMIT ?`
    : `SELECT * FROM stacks ORDER BY slug LIMIT ?`;

  const result = await db.execute({ sql, args });
  return result.rows.map((row) => {
    const r = row as unknown as { slug: string; title: string; description: string; icon: string; difficulty: string; layers: string };
    return { ...r, layers: JSON.parse(r.layers) };
  });
}

/** npm / PyPI monthly downloads for a tool (table filled weekly by apps/agent-tools/scripts/fetch-downloads.ts). */
export async function getToolPackages(toolId: string): Promise<{ registry: string; package: string; downloads_30d: number | null; fetched_at: string }[]> {
  try {
    const r = await db.execute({ sql: "SELECT registry, package, downloads_30d, fetched_at FROM tool_packages WHERE tool_id = ? ORDER BY downloads_30d DESC", args: [toolId] });
    return r.rows.map((x) => ({ registry: String(x.registry), package: String(x.package), downloads_30d: x.downloads_30d === null ? null : Number(x.downloads_30d), fetched_at: String(x.fetched_at) }));
  } catch {
    return []; // table not created yet
  }
}

/** Every tool with a package download count (for the /downloads leaderboard). */
export async function getDownloadRows(): Promise<{ id: string; name: string; stars: number | null; registry: string; package: string; downloads_30d: number | null }[]> {
  try {
    const r = await db.execute("SELECT t.id, t.name, t.github_stars, p.registry, p.package, p.downloads_30d FROM tool_packages p JOIN tools t ON t.id = p.tool_id WHERE p.downloads_30d IS NOT NULL");
    return r.rows.map((x) => ({ id: String(x.id), name: String(x.name), stars: x.github_stars === null ? null : Number(x.github_stars), registry: String(x.registry), package: String(x.package), downloads_30d: Number(x.downloads_30d) }));
  } catch {
    return [];
  }
}
