import { db } from "@/lib/db";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const stack = await req.json();

    if (!stack.title || !stack.layers || !Array.isArray(stack.layers)) {
      return Response.json({ error: "Invalid stack" }, { status: 400 });
    }

    // Generate slug from title
    const baseSlug = stack.title
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
        stack.title,
        stack.description || "",
        stack.icon || "🔧",
        stack.difficulty || "intermediate",
        JSON.stringify(stack.layers),
        JSON.stringify(stack.tags || []),
        now,
        now,
      ],
    });

    return Response.json({ slug, saved: true });
  } catch (err: any) {
    console.error("Save stack error:", err);
    return Response.json({ error: "Failed to save" }, { status: 500 });
  }
}
