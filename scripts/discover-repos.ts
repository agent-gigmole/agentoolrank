#!/usr/bin/env bun
/**
 * Discover AI Agent GitHub repos via Search API + awesome-lists.
 * Outputs deduplicated owner/repo pairs as JSON for crawl-github.ts.
 *
 * Usage: GITHUB_TOKEN=xxx bun run scripts/discover-repos.ts
 *
 * Strategies:
 * 1. GitHub Search API with multiple keyword queries
 * 2. Parse popular awesome-lists for repo links
 * 3. Deduplicate against existing DB entries
 */
import { db } from "../src/lib/db";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) {
  console.error("GITHUB_TOKEN required.");
  process.exit(1);
}

// Minimum stars to filter out noise
const MIN_STARS = 500;

// Search queries targeting different AI agent niches
const SEARCH_QUERIES = [
  // Core agent frameworks
  "ai agent framework",
  "llm agent",
  "autonomous agent",
  "ai agent platform",
  "multi-agent",
  // Specific technologies
  "langchain tool",
  "function calling llm",
  "tool use ai",
  "retrieval augmented generation",
  "rag framework",
  // Agent types
  "coding assistant ai",
  "code generation llm",
  "browser automation ai",
  "web scraping ai",
  "voice agent ai",
  // Infrastructure
  "llm observability",
  "llm evaluation",
  "vector database",
  "embedding model",
  "prompt engineering tool",
  "llm gateway",
  "ai workflow",
  "ai orchestration",
  // Low-code/no-code
  "no-code ai",
  "ai workflow builder",
  "chatbot builder",
  // Protocols
  "model context protocol",
  "agent protocol",
  // Specific niches
  "ai sandbox",
  "code interpreter ai",
  "document ai",
  "ai data extraction",
  "knowledge graph ai",
  "ai memory",
];

interface SearchResult {
  owner: string;
  repo: string;
  stars: number;
  description: string;
}

async function searchGitHub(query: string, page = 1): Promise<{ items: SearchResult[]; totalCount: number }> {
  const q = encodeURIComponent(`${query} stars:>=${MIN_STARS} language:Python OR language:TypeScript OR language:JavaScript OR language:Rust OR language:Go`);
  const url = `https://api.github.com/search/repositories?q=${q}&sort=stars&order=desc&per_page=100&page=${page}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (res.status === 403 || res.status === 429) {
    console.warn(`  Rate limited on search. Waiting 60s...`);
    await new Promise((r) => setTimeout(r, 60_000));
    return searchGitHub(query, page);
  }

  if (!res.ok) {
    console.error(`  Search API ${res.status}: ${await res.text()}`);
    return { items: [], totalCount: 0 };
  }

  const data = await res.json() as {
    total_count: number;
    items: Array<{
      full_name: string;
      stargazers_count: number;
      description: string | null;
      archived: boolean;
      fork: boolean;
    }>;
  };

  const items = data.items
    .filter((item) => !item.archived && !item.fork)
    .map((item) => {
      const [owner, repo] = item.full_name.split("/");
      return {
        owner,
        repo,
        stars: item.stargazers_count,
        description: item.description ?? "",
      };
    });

  return { items, totalCount: data.total_count };
}

async function fetchAwesomeList(owner: string, repo: string): Promise<SearchResult[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/readme`;
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.raw",
    },
  });

  if (!res.ok) return [];
  const text = await res.text();

  // Extract GitHub repo links from markdown
  const repoPattern = /github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/g;
  const results: SearchResult[] = [];
  const seen = new Set<string>();

  let match;
  while ((match = repoPattern.exec(text)) !== null) {
    const [, owner, repo] = match;
    // Skip common non-repo paths
    if (["issues", "pulls", "blob", "tree", "wiki", "releases", "topics"].includes(repo)) continue;
    // Clean repo name (remove trailing punctuation)
    const cleanRepo = repo.replace(/[.)]+$/, "");
    const key = `${owner}/${cleanRepo}`.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      results.push({ owner, repo: cleanRepo, stars: 0, description: "" });
    }
  }

  return results;
}

// Awesome lists to mine for repos
const AWESOME_LISTS: Array<[string, string]> = [
  ["e2b-dev", "awesome-ai-agents"],
  ["Jenqyang", "awesome-agents"],
  ["slavakurilyak", "awesome-ai-agents"],
  ["kyrolabs", "awesome-langchain"],
  ["jxnl", "awesome-rag"],
  ["steven2358", "awesome-generative-ai"],
  ["mahseema", "awesome-ai-tools"],
  ["ikaijua", "Awesome-AITools"],
  ["aimerou", "awesome-ai-papers"],
  ["filipecalegario", "awesome-generative-ai"],
  ["Shubhamsaboo", "awesome-llm-apps"],
];

// Additional curated repos that search might miss (high-quality, niche tools)
const EXTRA_REPOS: Array<[string, string]> = [
  // Agent frameworks not in seed
  ["stanfordnlp", "dspy"],
  ["Significant-Gravitas", "AutoGPT"],
  ["assafelovic", "gpt-researcher"],
  ["geekan", "MetaGPT"],
  ["princeton-nlp", "SWE-agent"],
  ["SWE-agent", "SWE-agent"],
  ["OpenBMB", "ChatDev"],
  ["aiwaves-cn", "agents"],
  ["TransformerOptimus", "SuperAGI"],
  ["yoheinakajima", "babyagi"],
  ["jina-ai", "jina"],
  ["deepset-ai", "haystack"],
  ["embedchain", "embedchain"],
  ["Mintplex-Labs", "anything-llm"],
  ["lobehub", "lobe-chat"],
  ["open-webui", "open-webui"],
  ["ChatGPTNextWeb", "ChatGPT-Next-Web"],
  ["mckaywrigley", "chatbot-ui"],

  // RAG & Knowledge
  ["run-llama", "llama_index"],
  ["pgvector", "pgvector"],
  ["milvus-io", "milvus"],
  ["zilliztech", "GPTCache"],
  ["neuml", "txtai"],
  ["chatchat-space", "Langchain-Chatchat"],
  ["infiniflow", "ragflow"],
  ["QuivrHQ", "quivr"],

  // Code/Dev tools
  ["TabbyML", "tabby"],
  ["continuedev", "continue"],
  ["sourcegraph", "cody"],
  ["Pythagora-io", "gpt-pilot"],
  ["stitionai", "devika"],
  ["OpenDevin", "OpenDevin"],
  ["sweepai", "sweep"],
  ["codestoryai", "sidecar"],
  ["aorwall", "moatless-tools"],

  // Browser/Web agents
  ["AskUI", "askui"],
  ["AntonioDehesa", "WebVoyager"],
  ["lavague-ai", "LaVague"],
  ["AskUI", "askui"],
  ["AntonioDehesa", "WebVoyager"],

  // Observability & eval
  ["confident-ai", "deepeval"],
  ["explodinggradients", "ragas"],
  ["uptrain-ai", "uptrain"],
  ["promptfoo", "promptfoo"],
  ["whylabs", "langkit"],
  ["braintrustdata", "braintrust"],

  // Tool integration / MCP
  ["modelcontextprotocol", "typescript-sdk"],
  ["modelcontextprotocol", "python-sdk"],
  ["mark3labs", "mcp-go"],
  ["punkpeye", "awesome-mcp-servers"],
  ["wong2", "chatgpt-google-extension"],

  // Voice / multimodal
  ["openai", "whisper"],
  ["suno-ai", "bark"],
  ["coqui-ai", "TTS"],
  ["fixie-ai", "ultravox"],

  // Infrastructure
  ["vllm-project", "vllm"],
  ["ggerganov", "llama.cpp"],
  ["ollama", "ollama"],
  ["LocalAI-org", "LocalAI"],
  ["bentoml", "OpenLLM"],
  ["mlc-ai", "mlc-llm"],
  ["huggingface", "text-generation-inference"],
  ["oobabooga", "text-generation-webui"],
  ["lm-sys", "FastChat"],
  ["abetlen", "llama-cpp-python"],

  // Workflow / orchestration
  ["prefecthq", "prefect"],
  ["temporalio", "temporal"],
  ["airflow-helm", "charts"],
  ["windmill-labs", "windmill"],

  // Document/data
  ["Unstructured-IO", "unstructured"],
  ["nlmatics", "llmsherpa"],
  ["docugami", "docugami-langchain"],
  ["pdfminer", "pdfminer.six"],

  // Multi-modal
  ["haotian-liu", "LLaVA"],
  ["THUDM", "CogVLM"],

  // Guardrails & safety
  ["guardrails-ai", "guardrails"],
  ["NVIDIA", "NeMo-Guardrails"],
  ["rebuff-ai", "rebuff"],
  ["protectai", "llm-guard"],

  // Prompt engineering
  ["guidance-ai", "guidance"],
  ["outlines-dev", "outlines"],
  ["microsoft", "TypeChat"],
  ["instructor-ai", "instructor"],

  // Deployment
  ["BentoML", "BentoML"],
  ["ray-project", "ray"],
  ["modal-labs", "modal-client"],

  // Finetuning
  ["huggingface", "peft"],
  ["hiyouga", "LLaMA-Factory"],
  ["unslothai", "unsloth"],
  ["axolotl-ai-cloud", "axolotl"],
];

async function main() {
  const discovered = new Map<string, SearchResult>(); // key: "owner/repo" lowercase

  // 1. GitHub Search API
  console.log("=== Phase 1: GitHub Search API ===");
  for (const query of SEARCH_QUERIES) {
    console.log(`Searching: "${query}"`);
    const { items, totalCount } = await searchGitHub(query);
    console.log(`  Found ${items.length} repos (total: ${totalCount})`);

    for (const item of items) {
      const key = `${item.owner}/${item.repo}`.toLowerCase();
      if (!discovered.has(key)) {
        discovered.set(key, item);
      }
    }

    // GitHub Search API: max 30 requests/min
    await new Promise((r) => setTimeout(r, 2500));
  }
  console.log(`After search: ${discovered.size} unique repos\n`);

  // 2. Awesome lists
  console.log("=== Phase 2: Awesome Lists ===");
  for (const [owner, repo] of AWESOME_LISTS) {
    console.log(`Parsing: ${owner}/${repo}`);
    const repos = await fetchAwesomeList(owner, repo);
    console.log(`  Found ${repos.length} repo links`);

    for (const item of repos) {
      const key = `${item.owner}/${item.repo}`.toLowerCase();
      if (!discovered.has(key)) {
        discovered.set(key, item);
      }
    }

    await new Promise((r) => setTimeout(r, 500));
  }
  console.log(`After awesome-lists: ${discovered.size} unique repos\n`);

  // 3. Extra curated repos
  console.log("=== Phase 3: Curated Extras ===");
  for (const [owner, repo] of EXTRA_REPOS) {
    const key = `${owner}/${repo}`.toLowerCase();
    if (!discovered.has(key)) {
      discovered.set(key, { owner, repo, stars: 0, description: "" });
    }
  }
  console.log(`After curated: ${discovered.size} unique repos\n`);

  // 4. Deduplicate against existing DB
  console.log("=== Phase 4: Dedup against DB ===");
  const existing = await db.execute("SELECT github_owner, github_repo FROM tools WHERE github_owner IS NOT NULL");
  const existingSet = new Set(
    existing.rows.map((r: any) => `${r.github_owner}/${r.github_repo}`.toLowerCase())
  );
  console.log(`Existing in DB: ${existingSet.size} repos`);

  const newRepos: Array<[string, string]> = [];
  for (const [key, item] of discovered) {
    if (!existingSet.has(key)) {
      newRepos.push([item.owner, item.repo]);
    }
  }
  console.log(`New repos to crawl: ${newRepos.length}\n`);

  // 5. Write output file
  const outputPath = "scripts/discovered-repos.json";
  await Bun.write(outputPath, JSON.stringify(newRepos, null, 2));
  console.log(`Written to ${outputPath}`);

  // Also output as const for easy copy into crawl-github.ts
  console.log(`\nTotal discovered: ${discovered.size}`);
  console.log(`Already in DB: ${existingSet.size}`);
  console.log(`New to crawl: ${newRepos.length}`);
}

main().catch(console.error);
