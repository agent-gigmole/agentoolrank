/**
 * Add the "mcp-servers" category to tools whose PRIMARY purpose is MCP (servers, SDKs, MCP tooling).
 * Candidates: name/tagline mention MCP; LLM confirms. Appends the tag, never removes existing ones.
 * Usage: bun run scripts/tag-mcp.ts [--apply]
 */
import { config } from "dotenv";
import { createClient } from "@libsql/client";
import { llm } from "./llm";

config({ path: new URL("../.env.local", import.meta.url).pathname });
const apply = process.argv.includes("--apply");
const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });

await db.execute({
  sql: "INSERT OR IGNORE INTO categories (slug, name, description, icon) VALUES (?, ?, ?, ?)",
  args: ["mcp-servers", "MCP Servers", "Model Context Protocol servers, SDKs and tooling that give AI agents access to tools, data and apps.", "🔌"],
});

const rows = (await db.execute(`SELECT id, name, tagline, category_tags FROM tools WHERE lower(name) LIKE '%mcp%' OR lower(id) LIKE '%mcp%' OR lower(tagline) LIKE '%mcp%' OR lower(tagline) LIKE '%model context protocol%'`)).rows as unknown as Array<{ id: string; name: string; tagline: string; category_tags: string }>;
const list = rows.map((r) => `${r.id}: ${r.name} — ${r.tagline.slice(0, 160)}`).join("\n");
const prompt = `For each project, answer whether MCP (Model Context Protocol) is its PRIMARY purpose: it is an MCP server, an MCP SDK/framework, or tooling specifically for building/running/testing MCP servers. Apps or platforms that merely support MCP among many features are NOT primary.

${list}

Reply with JSON only: {"primary": ["id", ...]}`;
const text = await llm(prompt, { maxTokens: 800, temperature: 0 });
const known = new Set(rows.map((r) => r.id));
const primary: string[] = (JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? "{}").primary ?? []).filter((id: string) => known.has(id));
console.log(`candidates=${rows.length} primary=${primary.length}\n  yes: ${primary.join(", ")}\n  no: ${rows.filter((r) => !primary.includes(r.id)).map((r) => r.id).join(", ")}`);

if (apply) {
  const stmts = rows.filter((r) => primary.includes(r.id)).map((r) => {
    const tags: string[] = JSON.parse(r.category_tags || "[]");
    if (!tags.includes("mcp-servers")) tags.push("mcp-servers");
    return { sql: "UPDATE tools SET category_tags = ? WHERE id = ?", args: [JSON.stringify(tags), r.id] };
  });
  await db.batch(stmts, "write");
  console.log(`tagged ${stmts.length}`);
}
