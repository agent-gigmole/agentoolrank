// Published translations (table tool_i18n, written by scripts/translate-tools.ts): auto-review approved AND
// human_reviewed >= 1 (1 = read in full by the owner, 2 = batch passed a 10% sample read). Missing table → none.
import { db } from "@repo/db";
import { parseToolTranslation, type ToolTranslation } from "./i18n";

export async function getTranslation(toolId: string, lang: string): Promise<ToolTranslation | null> {
  try {
    const r = await db.execute({ sql: "SELECT content FROM tool_i18n WHERE tool_id = ? AND lang = ? AND status = 'approved' AND human_reviewed >= 1", args: [toolId, lang] });
    return r.rows[0] ? parseToolTranslation(String(r.rows[0].content)) : null;
  } catch {
    return null;
  }
}

export async function translatedLangs(toolId: string): Promise<string[]> {
  try {
    const r = await db.execute({ sql: "SELECT lang FROM tool_i18n WHERE tool_id = ? AND status = 'approved' AND human_reviewed >= 1", args: [toolId] });
    return r.rows.map((x) => String(x.lang));
  } catch {
    return [];
  }
}

export async function translatedTools(lang: string): Promise<Array<{ id: string; updated_at: string }>> {
  try {
    const r = await db.execute({ sql: "SELECT i.tool_id, i.updated_at FROM tool_i18n i JOIN tools t ON t.id = i.tool_id WHERE i.lang = ? AND i.status = 'approved' AND i.human_reviewed >= 1", args: [lang] });
    return r.rows.map((x) => ({ id: String(x.tool_id), updated_at: String(x.updated_at) }));
  } catch {
    return [];
  }
}

/** Published translated tools for a language, highest score first (for the localized index pages). */
export async function translatedToolList(lang: string): Promise<Array<{ id: string; name: string; tagline: string; stars: number | null }>> {
  try {
    const r = await db.execute({
      sql: `SELECT t.id, t.name, t.github_stars, i.content FROM tool_i18n i JOIN tools t ON t.id = i.tool_id
            WHERE i.lang = ? AND i.status = 'approved' AND i.human_reviewed >= 1 ORDER BY t.score DESC`,
      args: [lang],
    });
    return r.rows.flatMap((x) => {
      const tr = parseToolTranslation(String(x.content));
      return tr ? [{ id: String(x.id), name: String(x.name), tagline: tr.tagline, stars: x.github_stars == null ? null : Number(x.github_stars) }] : [];
    });
  } catch {
    return [];
  }
}
