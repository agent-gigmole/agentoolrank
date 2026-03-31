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

// 90 days ago in ISO format for commit history query
const NINETY_DAYS_AGO = new Date(Date.now() - 90 * 86400000).toISOString();

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
// Note: $since is dynamically set to 90 days ago for commit count
const REPO_QUERY = `
query($owner: String!, $name: String!, $since: GitTimestamp!) {
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
          recentHistory: history(since: $since) {
            totalCount
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
    issues(first: 20, states: CLOSED, orderBy: {field: UPDATED_AT, direction: DESC}) {
      nodes { createdAt closedAt }
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
        recentHistory: { totalCount: number };
      };
    } | null;
    releases: {
      totalCount: number;
      nodes: Array<{ createdAt: string; tagName: string }>;
    };
    repositoryTopics: {
      nodes: Array<{ topic: { name: string } }>;
    };
    issues: {
      nodes: Array<{ createdAt: string; closedAt: string | null }>;
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

/** Calculate median hours between createdAt and closedAt for closed issues */
function calcIssueResponseMedianHours(
  issues: Array<{ createdAt: string; closedAt: string | null }>
): number | null {
  const durations = issues
    .filter((i) => i.closedAt != null)
    .map((i) => {
      const created = new Date(i.createdAt).getTime();
      const closed = new Date(i.closedAt!).getTime();
      return (closed - created) / (1000 * 60 * 60); // hours
    })
    .filter((h) => h >= 0)
    .sort((a, b) => a - b);

  if (durations.length === 0) return null;

  const mid = Math.floor(durations.length / 2);
  if (durations.length % 2 === 0) {
    return Math.round(((durations[mid - 1] + durations[mid]) / 2) * 10) / 10;
  }
  return Math.round(durations[mid] * 10) / 10;
}

/** Check if homepageUrl returns 404 via HEAD request */
async function checkDocsStatus(url: string | null): Promise<"ok" | "404" | "unknown"> {
  if (!url) return "unknown";
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);
    if (res.status === 404) return "404";
    if (res.ok) return "ok";
    return "unknown";
  } catch {
    return "unknown";
  }
}

const DRY_RUN = process.argv.includes("--dry-run");

async function fetchAndUpsertRepo(owner: string, name: string): Promise<boolean> {
  try {
    const data = await graphql<RepoData>(REPO_QUERY, { owner, name, since: NINETY_DAYS_AGO });
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
    const commitCount90d = repo.defaultBranchRef?.target?.recentHistory?.totalCount ?? null;
    const sixMonthsAgo = new Date(Date.now() - 180 * 86400000).toISOString();
    const recentReleases = repo.releases.nodes.filter((r) => r.createdAt > sixMonthsAgo).length;
    const issueResponseHours = calcIssueResponseMedianHours(repo.issues?.nodes ?? []);
    const docsStatus = await checkDocsStatus(repo.homepageUrl);

    const slug = makeSlug(owner, name);
    const now = new Date().toISOString();

    if (DRY_RUN) {
      console.log(`  [DRY-RUN] ${slug}:`);
      console.log(`    ★ stars=${repo.stargazerCount}`);
      console.log(`    commits_90d=${commitCount90d ?? '?'}`);
      console.log(`    releases_6m=${recentReleases}`);
      console.log(`    issue_response_median_hours=${issueResponseHours ?? '?'}`);
      console.log(`    docs_status=${docsStatus}`);
      console.log(`    homepage=${repo.homepageUrl ?? 'none'}`);
      console.log(`    last_commit=${lastCommit ?? '?'}`);
      return true;
    }

    await db.execute({
      sql: `INSERT INTO tools (id, name, tagline, description, logo_url, website_url, github_url, github_owner, github_repo,
            category_tags, industry_tags, github_stars, last_commit_date, commit_count_90d, release_count_6m,
            issue_response_hours, docs_status,
            source, pricing, content_status, score, created_at, updated_at, data_refreshed_at)
            VALUES (?, ?, ?, '', ?, ?, ?, ?, ?,
            ?, '["devtools"]', ?, ?, ?, ?,
            ?, ?,
            'github', ?, 'pending', 0, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
            github_stars = excluded.github_stars,
            last_commit_date = excluded.last_commit_date,
            commit_count_90d = excluded.commit_count_90d,
            release_count_6m = excluded.release_count_6m,
            issue_response_hours = excluded.issue_response_hours,
            docs_status = excluded.docs_status,
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
        commitCount90d,
        recentReleases,
        issueResponseHours,
        docsStatus,
        inferPricing(repo.licenseInfo?.spdxId ?? null, topics),
        now, now, now,
      ],
    });

    // Save metric snapshot
    const today = new Date().toISOString().slice(0, 10);
    await db.execute({
      sql: `INSERT OR REPLACE INTO metric_snapshots (tool_id, date, github_stars, commit_count_90d, release_count_6m)
            VALUES (?, ?, ?, ?, ?)`,
      args: [slug, today, repo.stargazerCount, commitCount90d, recentReleases],
    });

    console.log(`  ✓ ${slug} (★${repo.stargazerCount} commits90d=${commitCount90d ?? '?'} issueHrs=${issueResponseHours ?? '?'} docs=${docsStatus})`);
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

async function migrateSchema() {
  // Add new columns if they don't exist (idempotent)
  const migrations = [
    "ALTER TABLE tools ADD COLUMN issue_response_hours REAL",
    "ALTER TABLE tools ADD COLUMN docs_status TEXT DEFAULT 'unknown'",
  ];
  for (const sql of migrations) {
    try {
      await db.execute(sql);
      console.log(`  Migration OK: ${sql.slice(0, 60)}...`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("duplicate column") || msg.includes("already exists")) {
        // Column already exists, skip
      } else {
        console.warn(`  Migration warning: ${msg}`);
      }
    }
  }
}

async function main() {
  // Run schema migration before anything else
  if (!DRY_RUN) {
    console.log("Running schema migrations...");
    await migrateSchema();
  }

  // Check for discovered repos file (from discover-repos.ts)
  let repos: Array<[string, string]> = SEED_REPOS;

  const useDiscovered = process.argv.includes("--discovered");
  const seedOnly = process.argv.includes("--seed-only");

  if (useDiscovered) {
    try {
      const file = Bun.file("scripts/discovered-repos.json");
      if (await file.exists()) {
        const discovered = JSON.parse(await file.text()) as Array<[string, string]>;
        repos = discovered;
        console.log(`Using discovered-repos.json: ${repos.length} repos`);
      } else {
        console.error("discovered-repos.json not found. Run discover-repos.ts first.");
        process.exit(1);
      }
    } catch (err) {
      console.error(`Error reading discovered-repos.json: ${err}`);
      process.exit(1);
    }
  } else if (!seedOnly) {
    // Default: merge seed + discovered
    try {
      const file = Bun.file("scripts/discovered-repos.json");
      if (await file.exists()) {
        const discovered = JSON.parse(await file.text()) as Array<[string, string]>;
        const existing = new Set(SEED_REPOS.map(([o, n]) => `${o}/${n}`.toLowerCase()));
        const newOnes = discovered.filter(([o, n]) => !existing.has(`${o}/${n}`.toLowerCase()));
        repos = [...SEED_REPOS, ...newOnes];
        console.log(`Merged: ${SEED_REPOS.length} seed + ${newOnes.length} discovered = ${repos.length} total`);
      }
    } catch {
      // No discovered file, just use seed
    }
  }

  // In dry-run mode, limit to --limit N repos (default 3)
  if (DRY_RUN) {
    const limitIdx = process.argv.indexOf("--limit");
    const limit = limitIdx !== -1 ? parseInt(process.argv[limitIdx + 1]) || 3 : 3;
    repos = repos.slice(0, limit);
    console.log(`[DRY-RUN] Testing ${repos.length} repos (no DB writes)...`);
  }

  console.log(`Crawling ${repos.length} repos...`);
  let success = 0;
  let failed = 0;

  for (const [owner, name] of repos) {
    console.log(`${owner}/${name}`);
    const ok = await fetchAndUpsertRepo(owner, name);
    if (ok) success++;
    else failed++;

    // Small delay to be nice to the API
    await new Promise((r) => setTimeout(r, 500));
  }

  if (!DRY_RUN) {
    // Update category tool counts
    await db.execute(`
      UPDATE categories SET tool_count = (
        SELECT COUNT(*) FROM tools WHERE category_tags LIKE '%"' || categories.slug || '"%'
      )
    `);

    const count = await db.execute("SELECT COUNT(*) as c FROM tools");
    console.log(`Total tools in DB: ${(count.rows[0] as { c: number }).c}`);
  }

  console.log(`\nDone. ${success} succeeded, ${failed} failed.`);
}

main().catch(console.error);
