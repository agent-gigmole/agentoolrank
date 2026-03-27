#!/usr/bin/env bun
/**
 * Initialize the database with schema and seed categories.
 * Usage: bun run scripts/init-db.ts
 */
import { readFileSync } from "fs";
import { db } from "../src/lib/db";

const CATEGORIES = [
  { slug: "agent-frameworks", name: "Agent Frameworks", description: "Code-first libraries and SDKs for building, orchestrating, and deploying autonomous AI agents", icon: "🏗️" },
  { slug: "no-code-agent-builders", name: "No-Code Agent Builders", description: "Visual and low-code platforms that let non-developers create AI agents through drag-and-drop interfaces", icon: "🧩" },
  { slug: "coding-agents", name: "Coding Agents", description: "AI-powered tools that autonomously write, review, debug, and deploy code", icon: "💻" },
  { slug: "observability-evaluation", name: "Observability & Evaluation", description: "Monitoring, tracing, and testing infrastructure for running AI agents reliably in production", icon: "📡" },
  { slug: "memory-knowledge", name: "Memory & Knowledge", description: "Persistent memory layers and vector databases that give agents long-term recall and contextual retrieval", icon: "🧠" },
  { slug: "tool-integration", name: "Tool Integration & Infrastructure", description: "Connectors and platforms that let agents authenticate with and take actions across third-party APIs", icon: "🔌" },
  { slug: "browser-web-agents", name: "Browser & Web Agents", description: "Tools enabling AI agents to navigate websites, interact with web UIs, and extract structured data", icon: "🌐" },
  { slug: "agent-protocols", name: "Agent Protocols & Standards", description: "Open standards and protocols defining how agents communicate with tools and collaborate with other agents", icon: "📜" },
  { slug: "enterprise-agent-platforms", name: "Enterprise Agent Platforms", description: "Production-grade platforms from major vendors for deploying AI agents at scale across business functions", icon: "🏢" },
  { slug: "voice-agents", name: "Voice Agents", description: "Platforms for building AI agents that converse in real-time voice for customer service and telephony", icon: "🎙️" },
  { slug: "sandboxes-execution", name: "Sandboxes & Execution Environments", description: "Secure, isolated runtime environments where AI agents can safely execute code and interact with OS", icon: "🔒" },
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
