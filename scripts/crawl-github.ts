#!/usr/bin/env bun
/**
 * GitHub GraphQL crawler for AI Agent tools.
 * Fetches repo metadata, stars, commits, releases.
 * Uses point-based rate limiting (not request count).
 *
 * Usage: GITHUB_TOKEN=xxx bun run scripts/crawl-github.ts
 */
import { db } from "../src/lib/db";
import { ToolSchema } from "../src/lib/schema";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) {
  console.error("GITHUB_TOKEN required. Set it in .env or pass as env var.");
  process.exit(1);
}

const GRAPHQL_URL = "https://api.github.com/graphql";

async function graphql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      Authorization: `bearer ${GITHUB_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${res.status}: ${text}`);
  }

  const json = await res.json() as { data: T; errors?: Array<{ message: string }> };
  if (json.errors?.length) {
    console.warn("GraphQL warnings:", json.errors.map((e) => e.message).join(", "));
  }
  return json.data;
}

// Batch fetch repo details via GraphQL (saves rate limit points)
const REPO_QUERY = `
query($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    nameWithOwner
    name
    description
    url
    homepageUrl
    stargazerCount
    forkCount
    openGraphImageUrl
    licenseInfo { spdxId }
    primaryLanguage { name }
    defaultBranchRef {
      target {
        ... on Commit {
          history(first: 1) {
            nodes { committedDate }
          }
        }
      }
    }
    releases(first: 10, orderBy: {field: CREATED_AT, direction: DESC}) {
      totalCount
      nodes { createdAt tagName }
    }
    repositoryTopics(first: 20) {
      nodes { topic { name } }
    }
  }
  rateLimit { cost remaining resetAt }
}
`;

interface RepoData {
  repository: {
    nameWithOwner: string;
    name: string;
    description: string | null;
    url: string;
    homepageUrl: string | null;
    stargazerCount: number;
    forkCount: number;
    openGraphImageUrl: string;
    licenseInfo: { spdxId: string } | null;
    primaryLanguage: { name: string } | null;
    defaultBranchRef: {
      target: {
        history: { nodes: Array<{ committedDate: string }> };
      };
    } | null;
    releases: {
      totalCount: number;
      nodes: Array<{ createdAt: string; tagName: string }>;
    };
    repositoryTopics: {
      nodes: Array<{ topic: { name: string } }>;
    };
  };
  rateLimit: { cost: number; remaining: number; resetAt: string };
}

// Map GitHub topics to our category slugs
function inferCategories(topics: string[], description: string): string[] {
  const text = [...topics, description.toLowerCase()].join(" ");
  const cats: string[] = [];

  if (/framework|sdk|library|langchain|langgraph|crewai|autogen/.test(text)) cats.push("agent-frameworks");
  if (/no.?code|low.?code|visual|drag.?drop|dify|flowise|n8n/.test(text)) cats.push("no-code-agent-builders");
  if (/code|coding|ide|copilot|cursor|devin|claude.?code/.test(text)) cats.push("coding-agents");
  if (/observ|monitor|trac|eval|langsmith|langfuse|arize/.test(text)) cats.push("observability-evaluation");
  if (/memory|vector|rag|retrieval|knowledge|chroma|pinecone|mem0/.test(text)) cats.push("memory-knowledge");
  if (/tool.?use|integration|mcp|composio|connector|api/.test(text)) cats.push("tool-integration");
  if (/browser|web.?agent|scrape|crawl|playwright|selenium/.test(text)) cats.push("browser-web-agents");
  if (/protocol|standard|a2a|mcp|ag.?ui|interop/.test(text)) cats.push("agent-protocols");
  if (/enterprise|salesforce|microsoft|copilot.?studio/.test(text)) cats.push("enterprise-agent-platforms");
  if (/voice|speech|phone|call|telephony|vapi/.test(text)) cats.push("voice-agents");
  if (/sandbox|execution|e2b|isolated|container|runtime/.test(text)) cats.push("sandboxes-execution");

  return cats.length > 0 ? cats : ["agent-frameworks"];
}

function makeSlug(owner: string, name: string): string {
  // Use just the repo name if unique enough, otherwise owner-name
  const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
  return slug;
}

function inferPricing(license: string | null, topics: string[]): "free" | "freemium" | "paid" | "open-source" {
  if (license && ["MIT", "Apache-2.0", "GPL-3.0", "BSD-3-Clause", "ISC", "MPL-2.0"].includes(license)) {
    return "open-source";
  }
  if (topics.some((t) => /free|open.?source/.test(t))) return "open-source";
  return "free"; // default for GitHub repos
}

async function fetchAndUpsertRepo(owner: string, name: string): Promise<boolean> {
  try {
    const data = await graphql<RepoData>(REPO_QUERY, { owner, name });
    const repo = data.repository;
    if (!repo) {
      console.warn(`  Repo not found: ${owner}/${name}`);
      return false;
    }

    const rl = data.rateLimit;
    console.log(`  [rate] cost=${rl.cost} remaining=${rl.remaining}`);

    if (rl.remaining < 100) {
      console.warn(`  Rate limit low (${rl.remaining}). Pausing...`);
      await new Promise((r) => setTimeout(r, 60_000));
    }

    const topics = repo.repositoryTopics.nodes.map((n) => n.topic.name);
    const lastCommit = repo.defaultBranchRef?.target?.history?.nodes?.[0]?.committedDate ?? null;
    const sixMonthsAgo = new Date(Date.now() - 180 * 86400000).toISOString();
    const recentReleases = repo.releases.nodes.filter((r) => r.createdAt > sixMonthsAgo).length;

    const slug = makeSlug(owner, name);
    const now = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO tools (id, name, tagline, description, logo_url, website_url, github_url, github_owner, github_repo,
            category_tags, industry_tags, github_stars, last_commit_date, release_count_6m,
            source, pricing, content_status, score, created_at, updated_at, data_refreshed_at)
            VALUES (?, ?, ?, '', ?, ?, ?, ?, ?,
            ?, '["devtools"]', ?, ?, ?,
            'github', ?, 'pending', 0, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
            github_stars = excluded.github_stars,
            last_commit_date = excluded.last_commit_date,
            release_count_6m = excluded.release_count_6m,
            data_refreshed_at = excluded.data_refreshed_at,
            updated_at = excluded.updated_at`,
      args: [
        slug,
        repo.name,
        repo.description?.slice(0, 200) ?? "",
        repo.openGraphImageUrl || "",
        repo.homepageUrl || repo.url,
        repo.url,
        owner,
        name,
        JSON.stringify(inferCategories(topics, repo.description ?? "")),
        repo.stargazerCount,
        lastCommit,
        recentReleases,
        inferPricing(repo.licenseInfo?.spdxId ?? null, topics),
        now, now, now,
      ],
    });

    // Save metric snapshot
    const today = new Date().toISOString().slice(0, 10);
    await db.execute({
      sql: `INSERT OR REPLACE INTO metric_snapshots (tool_id, date, github_stars, release_count_6m)
            VALUES (?, ?, ?, ?)`,
      args: [slug, today, repo.stargazerCount, recentReleases],
    });

    console.log(`  ✓ ${slug} (★${repo.stargazerCount})`);
    return true;
  } catch (err) {
    console.error(`  ✗ ${owner}/${name}: ${err}`);
    return false;
  }
}

// === SEED LIST: Top AI Agent tools ===
const SEED_REPOS: Array<[string, string]> = [
  // Agent Frameworks
  ["langchain-ai", "langchain"],
  ["langchain-ai", "langgraph"],
  ["crewAIInc", "crewAI"],
  ["microsoft", "autogen"],
  ["joaomdmoura", "crewAI"],
  ["BerriAI", "litellm"],
  ["phidatahq", "phidata"],
  ["pydantic", "pydantic-ai"],
  ["anthropics", "claude-code"],
  ["livekit", "agents"],
  ["huggingface", "smolagents"],
  ["camel-ai", "camel"],

  // No-Code / Low-Code
  ["langgenius", "dify"],
  ["FlowiseAI", "Flowise"],
  ["n8n-io", "n8n"],

  // Coding Agents
  ["getcursor", "cursor"],
  ["Codium-ai", "AlphaCodium"],
  ["All-Hands-AI", "OpenHands"],
  ["paul-gauthier", "aether"],
  ["block", "goose"],

  // Observability
  ["langfuse", "langfuse"],
  ["Arize-ai", "phoenix"],
  ["traceloop", "openllmetry"],

  // Memory & Knowledge
  ["mem0ai", "mem0"],
  ["chroma-core", "chroma"],
  ["qdrant", "qdrant"],
  ["letta-ai", "letta"],
  ["weaviate", "weaviate"],

  // Tool Integration
  ["ComposioHQ", "composio"],
  ["ArcadeAI", "arcade-ai"],
  ["modelcontextprotocol", "servers"],

  // Browser Agents
  ["browser-use", "browser-use"],
  ["unclecode", "crawl4ai"],
  ["Skyvern-AI", "skyvern"],
  ["mendableai", "firecrawl"],

  // Protocols
  ["modelcontextprotocol", "specification"],
  ["google", "A2A"],

  // Voice Agents
  ["VapiAI", "server-sdk-python"],

  // Sandboxes
  ["e2b-dev", "E2B"],
  ["e2b-dev", "code-interpreter"],

  // Multi-agent / Orchestration
  ["microsoft", "semantic-kernel"],
  ["aws", "multi-agent-orchestrator"],
  ["langchain-ai", "langsmith-sdk"],
  ["DS4SD", "docling"],
  ["run-llama", "llama_index"],
  ["getzep", "zep"],
  ["superagent-ai", "superagent"],
];

async function main() {
  console.log(`Crawling ${SEED_REPOS.length} repos...`);
  let success = 0;
  let failed = 0;

  for (const [owner, name] of SEED_REPOS) {
    console.log(`${owner}/${name}`);
    const ok = await fetchAndUpsertRepo(owner, name);
    if (ok) success++;
    else failed++;

    // Small delay to be nice to the API
    await new Promise((r) => setTimeout(r, 500));
  }

  // Update category tool counts
  await db.execute(`
    UPDATE categories SET tool_count = (
      SELECT COUNT(*) FROM tools WHERE category_tags LIKE '%"' || categories.slug || '"%'
    )
  `);

  console.log(`\nDone. ${success} succeeded, ${failed} failed.`);

  const count = await db.execute("SELECT COUNT(*) as c FROM tools");
  console.log(`Total tools in DB: ${count.rows[0].c}`);
}

main().catch(console.error);
