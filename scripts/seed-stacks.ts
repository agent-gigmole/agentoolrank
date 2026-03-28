#!/usr/bin/env bun
/**
 * Seed Stack Graph data — predefined task/scenario tool combinations.
 *
 * Usage: bun run scripts/seed-stacks.ts
 */
import { db } from "../src/lib/db";

interface StackLayer {
  name: string;
  description: string;
  tools: Array<{ tool_id: string; role: string; note: string }>;
}

interface StackDef {
  slug: string;
  title: string;
  description: string;
  icon: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  layers: StackLayer[];
}

const STACKS: StackDef[] = [
  {
    slug: "rag-chatbot",
    title: "Build a RAG Chatbot",
    description: "A conversational AI that answers questions by retrieving information from your own documents. Combines a language model with a vector database for grounded, accurate responses.",
    icon: "💬",
    difficulty: "intermediate",
    layers: [
      {
        name: "Framework",
        description: "Orchestrates the RAG pipeline — document loading, chunking, retrieval, and response generation",
        tools: [
          { tool_id: "langchain", role: "Primary", note: "Most mature RAG ecosystem with 100+ integrations" },
          { tool_id: "gpt-index", role: "Alternative", note: "Purpose-built for RAG with simpler API" },
          { tool_id: "haystack", role: "Alternative", note: "Production-focused with pipeline abstraction" },
        ],
      },
      {
        name: "Vector Database",
        description: "Stores document embeddings for fast similarity search during retrieval",
        tools: [
          { tool_id: "chroma", role: "Primary", note: "Easiest to get started, runs in-process" },
          { tool_id: "qdrant", role: "Alternative", note: "Rust-powered, best for production scale" },
          { tool_id: "milvus", role: "Alternative", note: "Enterprise-grade, handles billions of vectors" },
        ],
      },
      {
        name: "Document Processing",
        description: "Extract text from PDFs, docs, and web pages into chunks for embedding",
        tools: [
          { tool_id: "docling", role: "Primary", note: "Best for complex PDFs with tables and figures" },
          { tool_id: "mineru", role: "Alternative", note: "High-accuracy document parsing" },
        ],
      },
      {
        name: "Chat UI",
        description: "Frontend interface for the chatbot",
        tools: [
          { tool_id: "open-webui", role: "Primary", note: "Full-featured chat UI with auth and history" },
          { tool_id: "lobe-chat", role: "Alternative", note: "Modern UI with plugin ecosystem" },
          { tool_id: "anything-llm", role: "Alternative", note: "All-in-one with built-in RAG" },
        ],
      },
    ],
  },
  {
    slug: "ai-coding-assistant",
    title: "Set Up an AI Coding Assistant",
    description: "An AI pair programmer that helps write, review, and debug code directly in your IDE or terminal. From simple autocomplete to autonomous coding agents.",
    icon: "👨‍💻",
    difficulty: "beginner",
    layers: [
      {
        name: "Coding Agent",
        description: "The AI that writes and edits code based on your instructions",
        tools: [
          { tool_id: "claude-code", role: "Primary", note: "Terminal-based, handles complex multi-file edits" },
          { tool_id: "codex", role: "Alternative", note: "OpenAI's coding agent with sandbox execution" },
          { tool_id: "openhands", role: "Alternative", note: "Open-source autonomous coding agent" },
        ],
      },
      {
        name: "IDE Integration",
        description: "Brings AI assistance directly into your editor",
        tools: [
          { tool_id: "continue", role: "Primary", note: "Open-source, works with any LLM provider" },
          { tool_id: "copilotkit", role: "Alternative", note: "React framework for building AI copilots" },
        ],
      },
      {
        name: "LLM Backend",
        description: "The language model powering code generation",
        tools: [
          { tool_id: "litellm", role: "Primary", note: "Unified API for 100+ LLM providers" },
          { tool_id: "ollama", role: "Alternative", note: "Run models locally, fully private" },
          { tool_id: "vllm", role: "Alternative", note: "High-throughput serving for self-hosted models" },
        ],
      },
    ],
  },
  {
    slug: "multi-agent-system",
    title: "Build a Multi-Agent System",
    description: "Multiple AI agents collaborating on complex tasks — each with specialized roles, communicating through structured protocols to solve problems no single agent can handle.",
    icon: "🤖",
    difficulty: "advanced",
    layers: [
      {
        name: "Agent Framework",
        description: "Defines agent roles, communication patterns, and task orchestration",
        tools: [
          { tool_id: "crewai", role: "Primary", note: "Role-based agents with intuitive crew metaphor" },
          { tool_id: "langgraph", role: "Alternative", note: "Graph-based workflows with fine-grained control" },
          { tool_id: "auto-gpt", role: "Alternative", note: "Autonomous agents with memory and planning" },
        ],
      },
      {
        name: "Tool Integration",
        description: "Connect agents to external APIs and services",
        tools: [
          { tool_id: "composio", role: "Primary", note: "150+ pre-built tool integrations" },
          { tool_id: "servers", role: "Alternative", note: "MCP servers for standardized tool access" },
        ],
      },
      {
        name: "Memory & State",
        description: "Persistent memory across agent interactions",
        tools: [
          { tool_id: "embedchain", role: "Primary", note: "Memory layer for AI agents" },
          { tool_id: "chroma", role: "Alternative", note: "Vector store for conversation history" },
        ],
      },
      {
        name: "Observability",
        description: "Monitor agent decisions, costs, and performance",
        tools: [
          { tool_id: "langfuse", role: "Primary", note: "Open-source LLM observability with traces" },
        ],
      },
    ],
  },
  {
    slug: "web-scraping-agent",
    title: "Build a Web Scraping Agent",
    description: "An AI-powered web scraper that can navigate pages, extract structured data, and handle dynamic content — going far beyond traditional CSS selector scraping.",
    icon: "🕷️",
    difficulty: "intermediate",
    layers: [
      {
        name: "Browser Agent",
        description: "AI that controls a browser to navigate and interact with web pages",
        tools: [
          { tool_id: "browser-use", role: "Primary", note: "LLM-driven browser automation, most popular" },
          { tool_id: "crawl4ai", role: "Alternative", note: "Async web crawler optimized for LLM input" },
        ],
      },
      {
        name: "Web Scraping Engine",
        description: "Handles crawling, rendering, and data extraction at scale",
        tools: [
          { tool_id: "firecrawl", role: "Primary", note: "Turn any URL into LLM-ready markdown" },
        ],
      },
      {
        name: "Data Processing",
        description: "Structure and clean extracted data",
        tools: [
          { tool_id: "pydantic", role: "Primary", note: "Type-safe data validation and parsing" },
          { tool_id: "dspy", role: "Alternative", note: "Programmatic LLM pipelines for extraction" },
        ],
      },
    ],
  },
  {
    slug: "no-code-ai-workflow",
    title: "Create AI Workflows Without Code",
    description: "Build sophisticated AI automations using visual drag-and-drop builders. Connect LLMs, APIs, and data sources without writing a single line of code.",
    icon: "🔄",
    difficulty: "beginner",
    layers: [
      {
        name: "Workflow Builder",
        description: "Visual platform for building AI-powered automations",
        tools: [
          { tool_id: "n8n", role: "Primary", note: "Most flexible, self-hostable, 400+ integrations" },
          { tool_id: "dify", role: "Alternative", note: "AI-native platform with built-in RAG and agents" },
          { tool_id: "flowise", role: "Alternative", note: "LangChain-based visual builder" },
          { tool_id: "langflow", role: "Alternative", note: "Visual framework for multi-agent apps" },
        ],
      },
      {
        name: "LLM Gateway",
        description: "Unified access to multiple AI providers",
        tools: [
          { tool_id: "litellm", role: "Primary", note: "Route to 100+ providers with one API" },
          { tool_id: "ollama", role: "Alternative", note: "Run models locally for privacy" },
        ],
      },
    ],
  },
  {
    slug: "llm-evaluation-pipeline",
    title: "Build an LLM Evaluation Pipeline",
    description: "Systematically test and measure LLM output quality. Essential for production AI — catch regressions, compare models, and ensure response quality at scale.",
    icon: "📊",
    difficulty: "intermediate",
    layers: [
      {
        name: "Eval Framework",
        description: "Define test cases, metrics, and run evaluation suites",
        tools: [
          { tool_id: "promptfoo", role: "Primary", note: "CLI-first, supports any LLM, CI/CD ready" },
          { tool_id: "deepeval", role: "Alternative", note: "Python-native with 14+ metrics built-in" },
          { tool_id: "ragas", role: "Alternative", note: "Specialized for RAG evaluation" },
        ],
      },
      {
        name: "Observability",
        description: "Monitor production LLM calls, trace chains, track costs",
        tools: [
          { tool_id: "langfuse", role: "Primary", note: "Open-source, integrates with all major frameworks" },
          { tool_id: "phoenix", role: "Alternative", note: "Real-time LLM traces and evals" },
        ],
      },
      {
        name: "LLM Gateway",
        description: "A/B test different models and providers",
        tools: [
          { tool_id: "litellm", role: "Primary", note: "Proxy for model comparison and fallback" },
        ],
      },
    ],
  },
  {
    slug: "voice-ai-agent",
    title: "Build a Voice AI Agent",
    description: "An AI that can hold natural voice conversations — answering phone calls, conducting interviews, or powering voice interfaces. Handles speech-to-text, reasoning, and text-to-speech in real-time.",
    icon: "🎙️",
    difficulty: "advanced",
    layers: [
      {
        name: "Voice Platform",
        description: "End-to-end voice agent infrastructure with telephony integration",
        tools: [
          { tool_id: "livekit-agents", role: "Primary", note: "Open-source, real-time voice/video agent framework" },
          { tool_id: "pipecat", role: "Alternative", note: "Framework for multimodal conversational AI" },
        ],
      },
      {
        name: "Agent Framework",
        description: "The reasoning engine behind voice interactions",
        tools: [
          { tool_id: "langgraph", role: "Primary", note: "Stateful conversation flows with branching logic" },
          { tool_id: "phidata", role: "Alternative", note: "Simple agent framework with tool calling" },
        ],
      },
    ],
  },
  {
    slug: "document-intelligence",
    title: "Build Document Intelligence",
    description: "Extract, analyze, and understand information from documents at scale. Parse PDFs, invoices, contracts, and research papers into structured, queryable data.",
    icon: "📄",
    difficulty: "intermediate",
    layers: [
      {
        name: "Document Parser",
        description: "Convert PDFs and documents into structured text",
        tools: [
          { tool_id: "docling", role: "Primary", note: "Handles complex layouts, tables, and figures" },
          { tool_id: "mineru", role: "Primary", note: "High-accuracy PDF extraction" },
        ],
      },
      {
        name: "RAG Framework",
        description: "Index and retrieve information from parsed documents",
        tools: [
          { tool_id: "ragflow", role: "Primary", note: "Deep document understanding with visual chunking" },
          { tool_id: "gpt-index", role: "Alternative", note: "Flexible indexing with multiple strategies" },
        ],
      },
      {
        name: "Vector Store",
        description: "Store document embeddings for semantic search",
        tools: [
          { tool_id: "chroma", role: "Primary", note: "Simple setup, great for prototyping" },
          { tool_id: "qdrant", role: "Alternative", note: "Production-grade with filtering" },
        ],
      },
    ],
  },
  {
    slug: "local-ai-setup",
    title: "Run AI Models Locally",
    description: "Set up a fully private AI stack on your own hardware. No data leaves your machine — ideal for sensitive data, air-gapped environments, or just saving on API costs.",
    icon: "🏠",
    difficulty: "beginner",
    layers: [
      {
        name: "Model Runtime",
        description: "Download and run open-source LLMs on your hardware",
        tools: [
          { tool_id: "ollama", role: "Primary", note: "Simplest setup, one command to get started" },
          { tool_id: "llama-cpp", role: "Alternative", note: "Maximum performance, supports CPU and GPU" },
          { tool_id: "vllm", role: "Alternative", note: "Best throughput for GPU serving" },
        ],
      },
      {
        name: "Chat Interface",
        description: "Web UI to interact with local models",
        tools: [
          { tool_id: "open-webui", role: "Primary", note: "ChatGPT-like UI for Ollama" },
          { tool_id: "jan", role: "Alternative", note: "Desktop app, works offline" },
          { tool_id: "lobe-chat", role: "Alternative", note: "Feature-rich with plugin system" },
        ],
      },
      {
        name: "Fine-tuning",
        description: "Customize models on your own data",
        tools: [
          { tool_id: "unsloth", role: "Primary", note: "2x faster fine-tuning, 70% less memory" },
          { tool_id: "llama-factory", role: "Alternative", note: "Unified fine-tuning for 100+ models" },
        ],
      },
    ],
  },
  {
    slug: "ai-code-review",
    title: "Automate Code Review with AI",
    description: "Set up AI-powered code review that catches bugs, suggests improvements, and enforces coding standards automatically on every pull request.",
    icon: "🔍",
    difficulty: "beginner",
    layers: [
      {
        name: "Code Review Agent",
        description: "AI that analyzes pull requests and provides feedback",
        tools: [
          { tool_id: "claude-code", role: "Primary", note: "Deep code understanding, multi-file context" },
          { tool_id: "codex", role: "Alternative", note: "OpenAI's code review with explanations" },
        ],
      },
      {
        name: "CI/CD Integration",
        description: "Trigger reviews automatically on pull requests",
        tools: [
          { tool_id: "semantic-kernel", role: "Alternative", note: "Enterprise-grade AI orchestration for CI" },
        ],
      },
      {
        name: "Observability",
        description: "Track review quality and false positive rates",
        tools: [
          { tool_id: "langfuse", role: "Primary", note: "Log and analyze all LLM interactions" },
        ],
      },
    ],
  },
  {
    slug: "ai-data-pipeline",
    title: "Build AI-Powered Data Pipelines",
    description: "Combine traditional data engineering with LLM intelligence. Extract, transform, and enrich data using AI — from unstructured sources into clean, structured datasets.",
    icon: "🔧",
    difficulty: "intermediate",
    layers: [
      {
        name: "Orchestration",
        description: "Schedule and manage pipeline tasks",
        tools: [
          { tool_id: "prefect", role: "Primary", note: "Modern Python orchestrator with great DX" },
          { tool_id: "n8n", role: "Alternative", note: "Visual workflow builder with AI nodes" },
        ],
      },
      {
        name: "Data Extraction",
        description: "Pull data from various sources",
        tools: [
          { tool_id: "firecrawl", role: "Primary", note: "Web scraping to clean markdown" },
          { tool_id: "docling", role: "Alternative", note: "Document parsing for PDFs and docs" },
        ],
      },
      {
        name: "LLM Processing",
        description: "Use LLMs for classification, extraction, and enrichment",
        tools: [
          { tool_id: "dspy", role: "Primary", note: "Programmatic LLM pipelines with optimization" },
          { tool_id: "instructor", role: "Alternative", note: "Structured output from LLMs with validation" },
        ],
      },
    ],
  },
  {
    slug: "mcp-tool-server",
    title: "Build an MCP Tool Server",
    description: "Create a Model Context Protocol server that exposes your APIs, databases, or services as tools that any AI agent can use through a standard protocol.",
    icon: "🔌",
    difficulty: "intermediate",
    layers: [
      {
        name: "MCP SDK",
        description: "Build servers that expose tools via the MCP protocol",
        tools: [
          { tool_id: "python-sdk", role: "Primary", note: "Official Python SDK with FastMCP" },
          { tool_id: "servers", role: "Primary", note: "Reference implementations and community servers" },
        ],
      },
      {
        name: "Agent Integration",
        description: "Connect MCP tools to AI agents",
        tools: [
          { tool_id: "claude-code", role: "Primary", note: "Native MCP support, use tools in terminal" },
          { tool_id: "langchain", role: "Alternative", note: "MCP client integration via LangChain" },
        ],
      },
      {
        name: "Tool Hosting",
        description: "Deploy and manage your tool servers",
        tools: [
          { tool_id: "composio", role: "Primary", note: "Managed tool hosting with 150+ connectors" },
        ],
      },
    ],
  },
  {
    slug: "ai-customer-support",
    title: "Build AI Customer Support",
    description: "Deploy an AI agent that handles customer inquiries, resolves common issues, and escalates complex cases to human agents — available 24/7 across chat, email, and voice.",
    icon: "🎧",
    difficulty: "intermediate",
    layers: [
      {
        name: "Knowledge Base",
        description: "Index your docs, FAQs, and product info for the AI to reference",
        tools: [
          { tool_id: "ragflow", role: "Primary", note: "Deep document understanding for accurate answers" },
          { tool_id: "anything-llm", role: "Alternative", note: "All-in-one with built-in document ingestion" },
        ],
      },
      {
        name: "Agent Framework",
        description: "Handle conversation flow, escalation rules, and multi-turn dialogue",
        tools: [
          { tool_id: "dify", role: "Primary", note: "Visual agent builder with human handoff" },
          { tool_id: "flowise", role: "Alternative", note: "Drag-and-drop conversation flows" },
        ],
      },
      {
        name: "Chat Interface",
        description: "Customer-facing chat widget",
        tools: [
          { tool_id: "open-webui", role: "Primary", note: "Customizable chat UI" },
          { tool_id: "librechat", role: "Alternative", note: "Multi-model chat with API keys" },
        ],
      },
    ],
  },
  {
    slug: "research-agent",
    title: "Build an AI Research Agent",
    description: "An autonomous agent that can search the web, read papers, synthesize findings, and produce research reports. Like having a tireless research assistant.",
    icon: "🔬",
    difficulty: "advanced",
    layers: [
      {
        name: "Research Agent",
        description: "Autonomous agent that plans and executes research tasks",
        tools: [
          { tool_id: "auto-gpt", role: "Primary", note: "Autonomous task planning and execution" },
          { tool_id: "crewai", role: "Alternative", note: "Team of specialized research agents" },
        ],
      },
      {
        name: "Web Search & Scraping",
        description: "Gather information from the internet",
        tools: [
          { tool_id: "firecrawl", role: "Primary", note: "Clean web content extraction" },
          { tool_id: "crawl4ai", role: "Alternative", note: "Async crawling optimized for LLM use" },
        ],
      },
      {
        name: "Knowledge Storage",
        description: "Organize and retrieve research findings",
        tools: [
          { tool_id: "embedchain", role: "Primary", note: "Memory layer for accumulated knowledge" },
          { tool_id: "chroma", role: "Alternative", note: "Vector store for semantic search over findings" },
        ],
      },
    ],
  },
  {
    slug: "llm-finetuning",
    title: "Fine-tune Your Own LLM",
    description: "Customize an open-source language model on your own data. Make it an expert in your domain — better outputs, lower costs, and full control.",
    icon: "🎯",
    difficulty: "advanced",
    layers: [
      {
        name: "Training Framework",
        description: "Fine-tune models efficiently with LoRA/QLoRA",
        tools: [
          { tool_id: "unsloth", role: "Primary", note: "2x faster, 70% less memory, easiest setup" },
          { tool_id: "llama-factory", role: "Alternative", note: "Supports 100+ models, WebUI included" },
        ],
      },
      {
        name: "Model Serving",
        description: "Deploy your fine-tuned model for inference",
        tools: [
          { tool_id: "vllm", role: "Primary", note: "Highest throughput for production serving" },
          { tool_id: "ollama", role: "Alternative", note: "Simple local deployment with GGUF" },
          { tool_id: "llama-cpp", role: "Alternative", note: "CPU inference for edge deployment" },
        ],
      },
      {
        name: "Evaluation",
        description: "Measure if fine-tuning improved quality",
        tools: [
          { tool_id: "promptfoo", role: "Primary", note: "Compare base vs fine-tuned model outputs" },
          { tool_id: "deepeval", role: "Alternative", note: "Automated eval with custom metrics" },
        ],
      },
    ],
  },
];

async function main() {
  console.log(`Seeding ${STACKS.length} stacks...`);
  const now = new Date().toISOString();

  for (const stack of STACKS) {
    // Verify all tool_ids exist
    for (const layer of stack.layers) {
      for (const tool of layer.tools) {
        const exists = await db.execute({ sql: "SELECT id FROM tools WHERE id = ?", args: [tool.tool_id] });
        if (exists.rows.length === 0) {
          console.warn(`  ⚠ Tool "${tool.tool_id}" not found in DB (stack: ${stack.slug}, layer: ${layer.name})`);
        }
      }
    }

    await db.execute({
      sql: `INSERT OR REPLACE INTO stacks (slug, title, description, icon, difficulty, layers, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [stack.slug, stack.title, stack.description, stack.icon, stack.difficulty, JSON.stringify(stack.layers), now, now],
    });

    console.log(`  ✓ ${stack.slug} (${stack.layers.length} layers, ${stack.layers.reduce((s, l) => s + l.tools.length, 0)} tools)`);
  }

  console.log(`\nDone. ${STACKS.length} stacks seeded.`);
}

main().catch(console.error);
