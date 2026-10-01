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
    const r = await db.execute({ sql: "SELECT tool_id, updated_at FROM tool_i18n WHERE lang = ? AND status = 'approved' AND human_reviewed >= 1", args: [lang] });
    return r.rows.map((x) => ({ id: String(x.tool_id), updated_at: String(x.updated_at) }));
  } catch {
    return [];
  }
}
