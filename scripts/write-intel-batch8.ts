import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
import { writeFileSync, readFileSync, existsSync, appendFileSync } from "fs";
dotenv.config({ path: "/home/qmt/workspace/ai-directory/.env.local" });

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const BACKUP_FILE = "/home/qmt/workspace/ai-directory/data/intelligence-backup.json";
const PROGRESS_LOG = "/home/qmt/workspace/ai-directory/data/intelligence-progress.log";

function loadBackup(): Record<string, any> {
  if (existsSync(BACKUP_FILE)) {
    try {
      return JSON.parse(readFileSync(BACKUP_FILE, "utf-8"));
    } catch {
      return {};
    }
  }
  return {};
}

const results: Record<string, any> = {
  "txtai": {
    "capabilities": [
      "Semantic/vector search with SQL and graph analysis",
      "Embeddings for text, documents, audio, images, and video",
      "LLM orchestration with RAG and autonomous agents",
      "Pipelines for QA, summarization, translation, transcription",
      "Workflows to chain pipelines and aggregate business logic",
      "Knowledge graph construction with LLM-driven entity extraction",
      "MCP and REST API server with multi-language bindings"
    ],
    "integrations": ["Hugging Face Transformers", "Sentence Transformers", "FastAPI", "llama.cpp", "LiteLLM", "smolagents", "JavaScript", "Java", "Rust", "Go"],
    "sdk_languages": ["Python"],
    "deployment": ["pip install", "Docker", "Cloud (txtai.cloud)", "Self-hosted API server"],
    "pricing_detail": { "free_tier": "Fully open source (Apache 2.0)", "paid_starts_at": "txtai.cloud hosted service (pricing not public)" },
    "limitations": [
      "Python-only core — client bindings exist but agents/pipelines require Python",
      "Broad scope means steeper learning curve compared to single-purpose tools",
      "Self-hosted requires managing embeddings model downloads and storage",
      "GPU recommended for large-scale indexing and LLM pipelines"
    ],
    "best_for": [
      "Building end-to-end semantic search + RAG applications in Python",
      "Teams wanting a single framework for embeddings, LLM orchestration, and agents",
      "Multi-modal search across text, images, audio, and video"
    ],
    "not_for": [
      "Projects needing a lightweight vector DB without an application framework",
      "Non-Python teams without REST API infrastructure"
    ],
    "key_differentiator": "All-in-one framework combining vector search, LLM orchestration, agents, and multi-modal pipelines — unlike LangChain (orchestration-only) or Weaviate (DB-only), txtai covers the full stack from indexing to agents"
  },

  "uqlm": {
    "capabilities": [
      "LLM hallucination detection via uncertainty quantification",
      "Black-box scorers (consistency-based, semantic entropy)",
      "White-box scorers (token probability-based)",
      "LLM-as-a-Judge scoring",
      "Ensemble scorers combining multiple methods",
      "Long-text claim-level uncertainty scoring",
      "Automatic uncertainty-minimized response selection"
    ],
    "integrations": ["LangChain Chat Models", "OpenAI", "Google Vertex AI", "Any LangChain-compatible LLM"],
    "sdk_languages": ["Python"],
    "deployment": ["pip install"],
    "pricing_detail": { "free_tier": "Fully open source (Apache 2.0)", "paid_starts_at": "N/A — free" },
    "limitations": [
      "Black-box methods require multiple LLM calls, increasing cost and latency",
      "White-box methods limited to models exposing token probabilities",
      "Research-focused library — less production infrastructure than guardrail platforms",
      "Async-first API may require adaptation for synchronous codebases"
    ],
    "best_for": [
      "Adding hallucination detection to existing LLM applications",
      "Research teams studying LLM uncertainty and reliability"
    ],
    "not_for": [
      "Teams needing a full guardrails/safety platform (use NeMo Guardrails)",
      "Real-time low-latency applications where multiple LLM calls are prohibitive"
    ],
    "key_differentiator": "Academically rigorous uncertainty quantification (published in JMLR/TMLR) with the broadest scorer variety — unlike guardrails tools that use simple heuristics, UQLM applies information-theoretic methods like semantic entropy for precise hallucination detection"
  },

  "swarms": {
    "capabilities": [
      "Multi-agent swarm orchestration for LLMs",
      "Cooperative agent communication and coordination",
      "Task decomposition and distribution across agents",
      "Integration with OpenAI API",
      "Agent spawning and self-scaling worker swarms"
    ],
    "integrations": ["OpenAI"],
    "sdk_languages": ["Python"],
    "deployment": ["pip install", "Git clone"],
    "pricing_detail": { "free_tier": "Fully open source", "paid_starts_at": "N/A — free" },
    "limitations": [
      "Early-stage project with many TODO items in roadmap",
      "Limited provider support (primarily OpenAI)",
      "Documentation and examples are sparse",
      "Production readiness unclear — experimental nature"
    ],
    "best_for": [
      "Experimenting with multi-agent LLM collaboration patterns",
      "Researchers exploring swarm intelligence with language models"
    ],
    "not_for": [
      "Production multi-agent systems (consider AutoGen or CrewAI)",
      "Teams needing stable, well-documented agent frameworks"
    ],
    "key_differentiator": "Focuses specifically on swarm-style multi-agent coordination where agents spawn, communicate, and self-organize — unlike AutoGen's structured conversations, Swarms emphasizes emergent cooperative behavior"
  },

  "bitnet": {
    "capabilities": [
      "Inference framework for 1-bit LLMs (BitNet b1.58)",
      "Optimized kernels for CPU inference (ARM and x86)",
      "GPU inference support",
      "1.37x-6.17x speedup over standard inference",
      "55-82% energy consumption reduction",
      "Run 100B parameter models on single CPU",
      "Parallel kernel implementations with configurable tiling"
    ],
    "integrations": ["Hugging Face models", "llama.cpp (based on)", "GGUF format"],
    "sdk_languages": ["C++", "Python"],
    "deployment": ["Build from source", "Conda environment", "Local CPU/GPU"],
    "pricing_detail": { "free_tier": "Fully open source (MIT)", "paid_starts_at": "N/A — free" },
    "limitations": [
      "Only supports 1-bit/ternary quantized models — not general-purpose inference",
      "Limited model ecosystem (specific BitNet-compatible models required)",
      "Requires cmake, clang, conda for building",
      "No cloud/API deployment out of the box"
    ],
    "best_for": [
      "Running large LLMs on consumer hardware with minimal energy use",
      "Edge deployment of 1-bit quantized models on CPU"
    ],
    "not_for": [
      "General LLM serving (use vLLM or TGI)",
      "Teams needing broad model compatibility beyond 1-bit models"
    ],
    "key_differentiator": "Microsoft's official 1-bit LLM inference engine — achieves human-reading-speed inference for 100B models on a single CPU, something no other framework can do, by leveraging ternary weight optimization"
  },

  "scalene": {
    "capabilities": [
      "High-performance CPU, GPU, and memory profiling for Python",
      "Line-level and function-level profiling",
      "Separates Python vs native code vs system time",
      "Memory leak detection",
      "Copy volume tracking (Python/library boundary crossing)",
      "GPU time profiling (NVIDIA)",
      "Web-based and CLI output interfaces"
    ],
    "integrations": ["NVIDIA GPU (CUDA)", "Python multiprocessing"],
    "sdk_languages": ["Python"],
    "deployment": ["pip install", "conda install"],
    "pricing_detail": { "free_tier": "Fully open source (Apache 2.0)", "paid_starts_at": "N/A — free" },
    "limitations": [
      "GPU profiling limited to NVIDIA GPUs",
      "Not AI-specific — general Python profiler",
      "Web GUI requires browser for full experience",
      "Sampling-based may miss very short-lived operations"
    ],
    "best_for": [
      "Profiling Python ML/AI training and inference code for performance bottlenecks",
      "Identifying memory leaks and unnecessary data copying in data pipelines"
    ],
    "not_for": [
      "Non-Python applications",
      "Production APM monitoring (use Datadog, New Relic)"
    ],
    "key_differentiator": "Only Python profiler that simultaneously profiles CPU (Python vs native), GPU, memory, copy volume, and detects leaks at line-level granularity — with just 10-20% overhead vs 100x+ for cProfile"
  },

  "agixt": {
    "capabilities": [
      "AI agent automation platform with 40+ built-in extensions",
      "Multi-provider LLM support (OpenAI, Anthropic, Google, Azure, local)",
      "Adaptive memory and conversation management",
      "Workflow automation with chained services",
      "OAuth and multi-tenancy support",
      "Python and TypeScript SDKs",
      "WebSocket and webhook integrations"
    ],
    "integrations": ["OpenAI", "Anthropic", "Google", "Azure", "Local models", "Tesla API", "Smart home devices", "Docker"],
    "sdk_languages": ["Python", "TypeScript"],
    "deployment": ["Docker", "Self-hosted"],
    "pricing_detail": { "free_tier": "Fully open source", "paid_starts_at": "N/A — free" },
    "limitations": [
      "Complex setup with many moving parts",
      "Documentation spread across docs folder rather than README",
      "Extension quality varies — some are experimental",
      "Heavy Docker dependency for full deployment"
    ],
    "best_for": [
      "Building autonomous AI agent systems with diverse tool integrations",
      "Enterprise automation combining AI with IoT/smart device control"
    ],
    "not_for": [
      "Simple chatbot applications (overkill)",
      "Teams wanting lightweight, minimal agent frameworks"
    ],
    "key_differentiator": "Comprehensive agent automation platform with 40+ built-in extensions covering enterprise, IoT, and crypto — unlike CrewAI or AutoGen which focus on agent conversations, AGiXT provides production infrastructure with OAuth, multi-tenancy, and real-world device control"
  },

  "agent-llm": {
    "capabilities": [
      "AI agent automation (redirects to AGiXT)",
      "Multi-provider LLM orchestration",
      "Instruction management and task execution",
      "Adaptive memory system",
      "Extension-based architecture"
    ],
    "integrations": ["OpenAI", "Anthropic", "Google", "Azure", "Local models"],
    "sdk_languages": ["Python", "TypeScript"],
    "deployment": ["Docker", "Self-hosted"],
    "pricing_detail": { "free_tier": "Fully open source", "paid_starts_at": "N/A — free" },
    "limitations": [
      "Repository is now a redirect to AGiXT — this is the legacy name",
      "No independent maintenance — all development happens on AGiXT",
      "May cause confusion with naming"
    ],
    "best_for": [
      "Historical reference — use AGiXT directly instead",
      "Users who discovered the project under its original name"
    ],
    "not_for": [
      "New projects — use AGiXT (Josh-XT/AGiXT) directly",
      "Anyone expecting a separate maintained project"
    ],
    "key_differentiator": "Legacy name for AGiXT — the repo redirects to AGiXT which is the actively maintained AI agent automation platform with 40+ extensions"
  },

  "swe-agent": {
    "capabilities": [
      "Autonomous software engineering agent for GitHub issues",
      "State-of-the-art on SWE-bench benchmarks",
      "Configurable via single YAML file",
      "Offensive cybersecurity (CTF) capabilities (EnIGMA)",
      "Custom task support beyond code fixing",
      "Support for multiple LLMs (GPT-4o, Claude, etc.)"
    ],
    "integrations": ["GitHub", "OpenAI GPT-4o", "Anthropic Claude", "Docker", "GitHub Codespaces"],
    "sdk_languages": ["Python"],
    "deployment": ["pip install", "Docker", "GitHub Codespaces"],
    "pricing_detail": { "free_tier": "Fully open source (MIT)", "paid_starts_at": "N/A — free (LLM API costs apply)" },
    "limitations": [
      "Now in maintenance mode — mini-SWE-agent is the successor",
      "Requires powerful LLM (GPT-4o/Claude) for good results — API costs can be significant",
      "Limited to code-related tasks — not a general-purpose agent",
      "Complex setup for custom environments"
    ],
    "best_for": [
      "Automated bug fixing and issue resolution in GitHub repos",
      "Research on AI-driven software engineering capabilities"
    ],
    "not_for": [
      "General-purpose AI assistants (not designed for chat)",
      "Teams wanting actively maintained tooling (consider mini-SWE-agent)"
    ],
    "key_differentiator": "Princeton/Stanford research project achieving SoTA on SWE-bench — the most rigorous benchmark for automated software engineering — with a simple, hackable design that leaves maximal agency to the LLM"
  },

  "jupyter-ai": {
    "capabilities": [
      "%%ai magic command for generative AI in notebooks",
      "Native chat UI in JupyterLab",
      "Support for 10+ model providers (OpenAI, Anthropic, Google, etc.)",
      "Local model support via GPT4All and Ollama",
      "HTML, math, and code generation as cell output",
      "IPython expression interpolation in prompts"
    ],
    "integrations": ["JupyterLab 4", "Jupyter Notebook 7", "OpenAI", "Anthropic", "Google Gemini", "AWS Bedrock", "Cohere", "Hugging Face", "MistralAI", "NVIDIA", "Ollama", "GPT4All"],
    "sdk_languages": ["Python"],
    "deployment": ["pip install", "conda install"],
    "pricing_detail": { "free_tier": "Fully open source (BSD-3)", "paid_starts_at": "N/A — free (LLM API costs apply)" },
    "limitations": [
      "Requires JupyterLab 4 or Notebook 7 — no JupyterLab 3 support",
      "Chat UI only available in JupyterLab (not Notebook)",
      "Each provider needs separate dependency installation",
      "Limited to notebook/JupyterLab context — not a standalone app"
    ],
    "best_for": [
      "Data scientists wanting AI assistance directly in Jupyter notebooks",
      "Teams already using JupyterLab who want integrated LLM access"
    ],
    "not_for": [
      "Building standalone AI applications",
      "Users on older JupyterLab 3 installations"
    ],
    "key_differentiator": "Official JupyterLab extension that brings AI directly into the notebook workflow with a magic command (%%ai) — unlike standalone AI tools, it's integrated into the data science environment where work actually happens"
  },

  "vanna": {
    "capabilities": [
      "Natural language to SQL conversion",
      "Streaming responses with tables, charts, and summaries",
      "User-aware row-level security",
      "Pre-built <vanna-chat> web component",
      "Custom tool extensibility",
      "Lifecycle hooks for rate limiting, audit logs, and content filtering",
      "LLM middleware for caching and prompt engineering"
    ],
    "integrations": ["OpenAI", "Anthropic", "Ollama", "Google Gemini", "AWS Bedrock", "Mistral", "PostgreSQL", "MySQL", "Snowflake", "BigQuery", "SQLite", "Oracle", "SQL Server", "DuckDB", "ClickHouse", "FastAPI", "Flask"],
    "sdk_languages": ["Python", "JavaScript"],
    "deployment": ["pip install", "FastAPI integration", "Self-hosted", "Web component embed"],
    "pricing_detail": { "free_tier": "Fully open source (MIT)", "paid_starts_at": "N/A — free" },
    "limitations": [
      "SQL-centric — not for non-SQL data sources",
      "V2.0 is a complete rewrite — migration from 0.x needed",
      "Requires LLM API for SQL generation — accuracy depends on model quality",
      "Web component requires server-side backend"
    ],
    "best_for": [
      "Building natural language database interfaces for business users",
      "Enterprise data analytics apps with per-user security and audit trails"
    ],
    "not_for": [
      "Non-SQL data analysis (NoSQL, file-based)",
      "Simple one-off SQL generation (overkill — use a prompt)"
    ],
    "key_differentiator": "Production-ready text-to-SQL with built-in web UI, row-level security, and streaming rich components — unlike generic LLM wrappers, Vanna 2.0 is an agent framework purpose-built for secure, user-aware database interactions"
  },

  "mergekit": {
    "capabilities": [
      "Merge pre-trained language models with multiple algorithms",
      "Out-of-core merging for resource-constrained environments",
      "LoRA extraction from merged models",
      "Mixture of Experts (MoE) merging",
      "Evolutionary merge optimization",
      "Multi-stage merging workflows",
      "Tokenizer transplantation"
    ],
    "integrations": ["Hugging Face Hub", "Llama", "Mistral", "GPT-NeoX", "StableLM"],
    "sdk_languages": ["Python"],
    "deployment": ["pip install (editable)", "CLI tool"],
    "pricing_detail": { "free_tier": "Fully open source (LGPL v3)", "paid_starts_at": "N/A — free" },
    "limitations": [
      "Requires understanding of model architectures for good merges",
      "Merge quality is unpredictable — results need evaluation",
      "LGPL license may be restrictive for some commercial uses",
      "CPU-heavy process even with GPU acceleration"
    ],
    "best_for": [
      "Creating custom merged LLMs by combining specialized models",
      "Research into model merging techniques and weight-space optimization"
    ],
    "not_for": [
      "Teams without ML expertise to evaluate merge quality",
      "Production model training (merging is a complement, not replacement)"
    ],
    "key_differentiator": "The definitive model merging toolkit — supports more merge algorithms (SLERP, TIES, DARE, frankenmerging, evolutionary) than any alternative, with uniquely efficient out-of-core processing that enables elaborate merges on 8GB VRAM"
  },

  "generative-ai": {
    "capabilities": [
      "Notebook samples for Google Cloud Generative AI",
      "Gemini model tutorials and demos",
      "Vertex AI Search integration examples",
      "RAG and Grounding with Vertex AI",
      "Image generation/editing with Imagen",
      "Speech processing with Chirp/USM",
      "Multi-modal AI application samples"
    ],
    "integrations": ["Google Cloud Vertex AI", "Gemini", "Imagen", "Chirp", "Google Cloud Storage", "BigQuery", "Cloud DLP"],
    "sdk_languages": ["Python", "Jupyter Notebooks"],
    "deployment": ["Google Colab", "Vertex AI Workbench", "Google Cloud"],
    "pricing_detail": { "free_tier": "Code samples are free; Google Cloud usage has free tier credits", "paid_starts_at": "Google Cloud pricing (pay-as-you-go)" },
    "limitations": [
      "Google Cloud-specific — not provider-agnostic",
      "Sample code, not a library/framework",
      "Requires Google Cloud account and billing setup",
      "Notebooks may become outdated as APIs evolve"
    ],
    "best_for": [
      "Learning Google Cloud's generative AI capabilities with hands-on examples",
      "Teams already on Google Cloud wanting to integrate Gemini/Vertex AI"
    ],
    "not_for": [
      "Multi-cloud or provider-agnostic AI development",
      "Production applications (these are samples, not production code)"
    ],
    "key_differentiator": "Google's official sample repository for Generative AI on Google Cloud — the most comprehensive collection of Gemini, Imagen, and Vertex AI notebooks, unlike third-party tutorials it's maintained by Google and always reflects latest APIs"
  },

  "text-generation-inference": {
    "capabilities": [
      "High-performance LLM serving with Rust/Python/gRPC",
      "Tensor parallelism across multiple GPUs",
      "Continuous batching for throughput optimization",
      "Token streaming via Server-Sent Events",
      "OpenAI-compatible Messages API",
      "Multiple quantization methods (GPTQ, AWQ, fp8, bitsandbytes)",
      "Speculative decoding for ~2x latency reduction",
      "Guided/JSON output generation"
    ],
    "integrations": ["Hugging Face Hub", "NVIDIA GPUs", "AMD GPUs", "AWS Inferentia", "Intel GPUs", "Google TPU", "Docker", "Kubernetes", "OpenTelemetry", "Prometheus"],
    "sdk_languages": ["Rust", "Python"],
    "deployment": ["Docker", "Kubernetes", "Hugging Face Inference Endpoints", "Self-hosted"],
    "pricing_detail": { "free_tier": "Open source (Apache 2.0)", "paid_starts_at": "Hugging Face Inference Endpoints pricing" },
    "limitations": [
      "Now in maintenance mode — HF recommends vLLM and SGLang going forward",
      "GPU required — CPU is not the intended platform",
      "Complex setup for multi-GPU configurations",
      "Docker-centric deployment may not suit all environments"
    ],
    "best_for": [
      "Production LLM serving with HuggingFace models at scale",
      "Teams needing OpenAI-compatible API for open-source models"
    ],
    "not_for": [
      "New projects (consider vLLM or SGLang per HF recommendation)",
      "CPU-only deployments"
    ],
    "key_differentiator": "Battle-tested in production at Hugging Face (powers HuggingChat and Inference API) — now in maintenance mode with recommendation to use vLLM/SGLang, but remains the reference implementation for optimized LLM serving with the broadest hardware support"
  },

  "ai-chatbot": {
    "capabilities": [
      "Full-stack chatbot template with Next.js App Router",
      "AI SDK integration with unified LLM API",
      "Multi-provider support via Vercel AI Gateway",
      "Persistent chat history with Neon Postgres",
      "File storage with Vercel Blob",
      "Authentication with Auth.js"
    ],
    "integrations": ["Vercel AI Gateway", "OpenAI", "Anthropic", "Google", "xAI", "Mistral", "DeepSeek", "Neon Postgres", "Vercel Blob", "Auth.js", "shadcn/ui", "Tailwind CSS"],
    "sdk_languages": ["TypeScript", "React"],
    "deployment": ["Vercel (one-click deploy)", "Self-hosted"],
    "pricing_detail": { "free_tier": "Open source template — free to use", "paid_starts_at": "Vercel hosting + LLM API costs" },
    "limitations": [
      "Template/starting point — requires customization for production",
      "Vercel-optimized — some features (AI Gateway OIDC) only work on Vercel",
      "Opinionated stack (Next.js + Neon + shadcn) may not fit all teams",
      "Database migration required for setup"
    ],
    "best_for": [
      "Quickly bootstrapping a production chatbot with Next.js",
      "Developers wanting a reference implementation of AI SDK best practices"
    ],
    "not_for": [
      "Teams not using Next.js/React ecosystem",
      "Enterprise chatbots needing custom backends (template is opinionated)"
    ],
    "key_differentiator": "Vercel's official AI chatbot template — the most polished and production-ready Next.js chatbot starter with AI SDK, unlike generic templates it includes auth, persistence, multi-provider routing, and one-click Vercel deployment"
  },

  "chat-ui": {
    "capabilities": [
      "Chat interface for LLMs (powers HuggingChat)",
      "OpenAI-compatible API support for any provider",
      "LLM Router with smart model selection (Omni)",
      "MCP tool integration",
      "MongoDB-backed chat history and user management",
      "Theming and customization",
      "Docker deployment with bundled MongoDB"
    ],
    "integrations": ["Any OpenAI-compatible API", "Hugging Face Inference Providers", "Ollama", "llama.cpp", "OpenRouter", "MongoDB", "MCP servers"],
    "sdk_languages": ["TypeScript", "Svelte"],
    "deployment": ["Docker", "npm (self-hosted)", "SvelteKit build"],
    "pricing_detail": { "free_tier": "Fully open source (Apache 2.0)", "paid_starts_at": "N/A — free" },
    "limitations": [
      "Only supports OpenAI-compatible APIs — legacy provider integrations removed",
      "Requires MongoDB for persistence (embedded fallback for dev only)",
      "SvelteKit-based — less familiar than React for many teams",
      "No built-in authentication system"
    ],
    "best_for": [
      "Self-hosting a ChatGPT-like interface for open-source models",
      "Organizations wanting HuggingChat-quality UI for their own LLMs"
    ],
    "not_for": [
      "Embedding AI chat into existing React/Vue applications",
      "Teams needing integrated authentication out of the box"
    ],
    "key_differentiator": "Powers HuggingChat (huggingface.co/chat) — the most production-proven open-source chat UI with unique LLM Router for automatic model selection and native MCP tool support, unlike simpler UIs it handles multi-user, multi-model deployments"
  },

  "langchain-dart": {
    "capabilities": [
      "LangChain port for Dart/Flutter ecosystem",
      "Unified API for multiple LLM providers",
      "RAG with document loaders, text splitters, and vector stores",
      "Agent framework with tool integration",
      "LangChain Expression Language (LCEL) for composability",
      "Prompt templates and output parsers"
    ],
    "integrations": ["OpenAI", "Anthropic", "Google (Gemini, VertexAI)", "Mistral AI", "Ollama", "Firebase", "Chroma", "Pinecone", "Supabase"],
    "sdk_languages": ["Dart", "Flutter"],
    "deployment": ["pub.dev package", "Flutter app integration"],
    "pricing_detail": { "free_tier": "Fully open source (MIT)", "paid_starts_at": "N/A — free" },
    "limitations": [
      "Unofficial port — may lag behind Python LangChain features",
      "Smaller community and ecosystem compared to Python/JS versions",
      "Some integrations may be less mature than Python equivalents",
      "Dart/Flutter-only — no cross-language support"
    ],
    "best_for": [
      "Flutter/Dart developers building LLM-powered mobile and web apps",
      "Teams wanting LangChain patterns in the Dart ecosystem"
    ],
    "not_for": [
      "Backend-heavy AI applications (Python LangChain is more mature)",
      "Teams not in the Dart/Flutter ecosystem"
    ],
    "key_differentiator": "The only LangChain implementation for Dart/Flutter — enables the massive Flutter developer community to build LLM apps with familiar patterns, including LCEL composability that no other Dart AI library offers"
  },

  "dust": {
    "capabilities": [
      "Custom AI agent platform for enterprise workflows",
      "Knowledge base and data connection management",
      "Agent building and deployment",
      "Team collaboration on AI workflows"
    ],
    "integrations": ["Enterprise data sources", "Slack", "Notion", "Google Drive"],
    "sdk_languages": ["TypeScript"],
    "deployment": ["Cloud (dust.tt)", "Self-hosted (open source)"],
    "pricing_detail": { "free_tier": "Open source self-hosted", "paid_starts_at": "dust.tt cloud platform (enterprise pricing)" },
    "limitations": [
      "Minimal README — documentation is external (docs.dust.tt)",
      "Enterprise-focused — may be too heavyweight for individual use",
      "Limited community documentation for self-hosting",
      "Cloud platform pricing not transparent"
    ],
    "best_for": [
      "Enterprise teams wanting custom AI agents connected to internal data",
      "Organizations needing managed AI agent platform with team collaboration"
    ],
    "not_for": [
      "Individual developers wanting simple AI tools",
      "Teams needing detailed open-source documentation for self-hosting"
    ],
    "key_differentiator": "Enterprise AI agent platform that connects to company knowledge bases (Slack, Notion, Drive) — unlike developer-focused frameworks, Dust is designed for non-technical teams to build and deploy custom AI agents"
  },

  "mlc-llm": {
    "capabilities": [
      "Universal LLM deployment across all platforms",
      "ML compilation for optimized inference",
      "OpenAI-compatible API (MLCEngine)",
      "Cross-platform support (Windows, macOS, Linux, iOS, Android, Web)",
      "Multiple GPU backend support (CUDA, Metal, Vulkan, WebGPU, OpenCL)"
    ],
    "integrations": ["WebGPU", "CUDA", "Metal", "Vulkan", "ROCm", "OpenCL", "WebLLM (browser)", "iOS/Android native"],
    "sdk_languages": ["Python", "JavaScript", "Swift", "Kotlin/Java", "C++"],
    "deployment": ["REST server", "Browser (WebGPU)", "iOS app", "Android app", "Desktop native", "pip install"],
    "pricing_detail": { "free_tier": "Fully open source (Apache 2.0)", "paid_starts_at": "N/A — free" },
    "limitations": [
      "Compilation step required for each model — not plug-and-play",
      "Smaller model ecosystem than llama.cpp or vLLM",
      "Complex build process for some platforms",
      "Performance tuning requires understanding of TVM/compiler concepts"
    ],
    "best_for": [
      "Deploying LLMs to every platform (mobile, browser, desktop, server)",
      "Teams needing a single engine across iOS, Android, Web, and server"
    ],
    "not_for": [
      "Quick prototyping (llama.cpp or Ollama are simpler)",
      "Teams wanting maximum server throughput (vLLM is more optimized for that)"
    ],
    "key_differentiator": "The only LLM engine that compiles and deploys to every platform (iOS, Android, browser, desktop, server) from a single codebase — unlike llama.cpp (CPU-focused) or vLLM (server-only), MLC LLM achieves native GPU acceleration everywhere via ML compilation"
  },

  "pgvector": {
    "capabilities": [
      "Vector similarity search as a Postgres extension",
      "Exact and approximate nearest neighbor search (HNSW, IVFFlat)",
      "Multiple distance metrics (L2, cosine, inner product, L1, Hamming, Jaccard)",
      "Half-precision, binary, and sparse vector support",
      "Full ACID compliance with Postgres",
      "Works with any Postgres client in any language"
    ],
    "integrations": ["PostgreSQL 13+", "Any Postgres client library", "Python", "Ruby", "Java", "Go", "Rust", "C#", "Node.js", "Elixir"],
    "sdk_languages": ["SQL", "C"],
    "deployment": ["Postgres extension", "Docker", "Homebrew", "APT/Yum", "conda-forge", "Hosted Postgres providers"],
    "pricing_detail": { "free_tier": "Fully open source (PostgreSQL license)", "paid_starts_at": "N/A — free" },
    "limitations": [
      "Tied to PostgreSQL — cannot be used with other databases",
      "HNSW index limited to 2000 dimensions for vector type",
      "Approximate search trades recall for speed — tuning required",
      "Not a standalone vector database — requires Postgres administration"
    ],
    "best_for": [
      "Adding vector search to existing PostgreSQL applications",
      "Teams wanting ACID-compliant vector storage with SQL joins"
    ],
    "not_for": [
      "Teams not using PostgreSQL",
      "Applications needing specialized vector DB features (multi-tenancy, built-in reranking)"
    ],
    "key_differentiator": "Vector search as a native Postgres extension — unlike standalone vector DBs (Pinecone, Weaviate), pgvector keeps vectors with your relational data, enabling JOINs, ACID transactions, and point-in-time recovery with zero infrastructure overhead"
  },

  "ludwig": {
    "capabilities": [
      "Declarative deep learning with YAML configuration",
      "LLM fine-tuning (QLoRA, LoRA, full fine-tune)",
      "Multi-task and multi-modal learning",
      "Distributed training (DDP, DeepSpeed)",
      "Hyperparameter optimization",
      "Model explainability and rich metric visualization",
      "Export to TorchScript, Triton, and HuggingFace"
    ],
    "integrations": ["PyTorch", "Hugging Face Transformers", "DeepSpeed", "Ray", "Kubernetes (KubeRay)", "Triton Inference Server", "Docker"],
    "sdk_languages": ["Python"],
    "deployment": ["pip install", "Docker", "Ray on Kubernetes", "CLI or Python API"],
    "pricing_detail": { "free_tier": "Fully open source (Apache 2.0)", "paid_starts_at": "N/A — free" },
    "limitations": [
      "Requires Python 3.12+ — may conflict with older environments",
      "Declarative approach limits flexibility for novel architectures",
      "GPU with 12+ GB VRAM needed for LLM fine-tuning",
      "Large dependency footprint with full installation"
    ],
    "best_for": [
      "Fine-tuning LLMs with minimal code using declarative YAML configs",
      "Teams wanting production-ready deep learning without boilerplate"
    ],
    "not_for": [
      "Custom architecture research (too opinionated)",
      "Teams needing lightweight, single-purpose training scripts"
    ],
    "key_differentiator": "Linux Foundation-hosted declarative deep learning framework — unlike Hugging Face Trainer (code-first) or AutoML tools (black-box), Ludwig lets you build custom LLM fine-tuning and multi-modal pipelines with just YAML while retaining expert-level control"
  }
};

async function main() {
  const backup = loadBackup();
  let ok = 0,
    fail = 0;

  for (const [id, intel] of Object.entries(results)) {
    try {
      backup[id] = intel;
      writeFileSync(BACKUP_FILE, JSON.stringify(backup, null, 2));

      await db.execute({
        sql: "UPDATE tools SET intelligence = ?, updated_at = datetime('now') WHERE id = ?",
        args: [JSON.stringify(intel), id],
      });

      const check = await db.execute({
        sql: "SELECT length(intelligence) as len FROM tools WHERE id = ?",
        args: [id],
      });

      const len = (check.rows[0] as any)?.len ?? 0;
      console.log(`${len < 10 ? "✗" : "✓"} ${id} (${len} bytes)`);
      appendFileSync(
        PROGRESS_LOG,
        `${new Date().toISOString()} | ${len < 10 ? "FAIL" : "OK"} | ${id} | ${len}\n`
      );

      if (len >= 10) ok++;
      else fail++;
    } catch (err: any) {
      console.error(`✗ ${id}: ${err.message}`);
      fail++;
    }
  }

  console.log(`\nBatch 8: ${ok} ok, ${fail} fail`);
}

main();
