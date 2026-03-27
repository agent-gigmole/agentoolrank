#!/usr/bin/env bun
/**
 * Initialize the database with schema and seed categories.
 * Usage: bun run scripts/init-db.ts
 */
import { readFileSync } from "fs";
import { db } from "../src/lib/db";

const CATEGORIES = [
  { slug: "framework", name: "Agent Frameworks", description: "Full-featured frameworks for building AI agents", icon: "🏗️" },
  { slug: "orchestration", name: "Orchestration", description: "Multi-agent coordination and workflow engines", icon: "🎭" },
  { slug: "rag", name: "RAG & Knowledge", description: "Retrieval-augmented generation and knowledge management", icon: "📚" },
  { slug: "code-agent", name: "Coding Agents", description: "AI agents that write, review, and debug code", icon: "💻" },
  { slug: "browser-agent", name: "Browser Agents", description: "Web browsing and automation agents", icon: "🌐" },
  { slug: "voice-agent", name: "Voice & Phone Agents", description: "Voice-powered AI agents for calls and conversations", icon: "🎙️" },
  { slug: "data-agent", name: "Data & Analytics Agents", description: "Agents for data analysis, ETL, and business intelligence", icon: "📊" },
  { slug: "customer-support", name: "Customer Support", description: "AI agents for customer service and helpdesk", icon: "🎧" },
  { slug: "sales-agent", name: "Sales & Outreach", description: "Agents for lead generation, outreach, and CRM", icon: "📈" },
  { slug: "devtools", name: "Developer Tools", description: "SDKs, MCP servers, testing tools, and agent infrastructure", icon: "🔧" },
  { slug: "memory-state", name: "Memory & State", description: "Long-term memory, context management, and state persistence for agents", icon: "🧠" },
  { slug: "deployment", name: "Deployment & Monitoring", description: "Agent hosting, observability, and production tooling", icon: "🚀" },
];

async function main() {
  console.log("Initializing database...");

  // Run schema
  const schema = readFileSync("db/schema.sql", "utf-8");
  const statements = schema
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    await db.execute(stmt);
  }
  console.log(`Applied ${statements.length} schema statements`);

  // Seed categories
  for (const cat of CATEGORIES) {
    await db.execute({
      sql: `INSERT OR REPLACE INTO categories (slug, name, description, icon) VALUES (?, ?, ?, ?)`,
      args: [cat.slug, cat.name, cat.description, cat.icon],
    });
  }
  console.log(`Seeded ${CATEGORIES.length} categories`);

  // Verify
  const result = await db.execute("SELECT COUNT(*) as count FROM categories");
  console.log(`Database ready. ${result.rows[0].count} categories.`);
}

main().catch(console.error);
