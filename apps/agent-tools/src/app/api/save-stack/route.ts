import { db } from "@repo/db";
import { checkRateLimit } from "@repo/db/rate-limit";
import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";

const MAX_TITLE_LENGTH = 200;
const MAX_LAYERS = 10;
const MAX_TOOLS_PER_LAYER = 5;
const MAX_JSON_SIZE = 50_000; // 50KB max payload

export async function POST(req: NextRequest) {
  try {
    // Rate limit saves by IP (shares the same pool as chat)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { ok } = checkRateLimit(ip);
    if (!ok) {
      return Response.json({ error: "Rate limit reached" }, { status: 429 });
    }

    const raw = await req.text();
    if (raw.length > MAX_JSON_SIZE) {
      return Response.json({ error: "Payload too large" }, { status: 400 });
    }

    const stack = JSON.parse(raw);

    if (!stack.title || typeof stack.title !== "string" || !stack.layers || !Array.isArray(stack.layers)) {
      return Response.json({ error: "Invalid stack" }, { status: 400 });
    }

    // Field validation
    const title = stack.title.slice(0, MAX_TITLE_LENGTH);
    const layers = stack.layers.slice(0, MAX_LAYERS).map((l: any) => ({
      name: String(l.name || "").slice(0, 100),
      description: String(l.description || "").slice(0, 300),
      tools: Array.isArray(l.tools) ? l.tools.slice(0, MAX_TOOLS_PER_LAYER).map((t: any) => ({
        tool_id: String(t.tool_id || "").slice(0, 80),
        role: ["Primary", "Alternative", "External"].includes(t.role) ? t.role : "External",
        note: String(t.note || "").slice(0, 200),
      })) : [],
    }));

    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 60);
    const slug = `custom-${baseSlug}-${Date.now().toString(36)}`;

    const now = new Date().toISOString();

    await db.execute({
      sql: `INSERT OR IGNORE INTO stacks (slug, title, description, icon, difficulty, layers, tags, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        slug,
        title,
        String(stack.description || "").slice(0, 500),
        String(stack.icon || "🔧").slice(0, 4),
        ["beginner", "intermediate", "advanced"].includes(stack.difficulty) ? stack.difficulty : "intermediate",
        JSON.stringify(layers),
        JSON.stringify(Array.isArray(stack.tags) ? stack.tags.slice(0, 5).map((t: any) => String(t).slice(0, 30)) : []),
        now,
        now,
      ],
    });

    // Revalidate blueprint pages so new stack appears immediately
    revalidatePath("/blueprint");
    revalidatePath("/zh/blueprint");
    revalidatePath(`/blueprint/${slug}`);
    revalidatePath(`/stack/${slug}`);

    return Response.json({ slug, saved: true });
  } catch (err: any) {
    console.error("Save stack error:", err);
    return Response.json({ error: "Failed to save" }, { status: 500 });
  }
}
