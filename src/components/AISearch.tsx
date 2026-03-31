"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect, useCallback } from "react";
import { StackFlow } from "./StackFlow";
import Link from "next/link";
import type { Locale } from "@/i18n/types";

// i18n strings for AISearch
const t = {
  en: {
    thinking: "Thinking...",
    send: "Send",
    popular: "Popular searches:",
    existingStacks: "Existing stacks that might help:",
    relatedTools: "Related tools:",
    statusAnalyzing: "Analyzing your requirements...",
    statusSelecting: "Selecting tools from 463 options...",
    statusBuilding: "Building your tool stack...",
    statusRendering: "Rendering flow diagram...",
    savePrompt: "Save this stack to get a permanent link",
    savePromptSub: "You can share it, come back to it later, or ask others for feedback",
    saveButton: "Save & Get Link",
    saving: "Saving...",
    savedMessage: "Saved! Your stack has a permanent link:",
    copy: "Copy",
    copyText: "Copy text",
    sharePrompt: "Share to get feedback:",
    copyMarkdown: "Copy as Markdown",
    copied: "Copied!",
    executionPlan: "Execution Plan",
    toolStack: "Tool Stack",
    watchOut: "Watch Out",
    placeholderInit: "Describe what you want to build... e.g. 我想做金融量化系统",
    placeholderFollowUp: "Type your answer here... 在这里回答",
    followUpHint: "Try: \"换个更便宜的\" · \"Add a monitoring layer\" · \"Make it simpler\"",
  },
  zh: {
    thinking: "思考中...",
    send: "发送",
    popular: "热门搜索：",
    existingStacks: "可能有帮助的现有方案：",
    relatedTools: "相关工具：",
    statusAnalyzing: "正在分析你的需求...",
    statusSelecting: "从 463 个工具中筛选...",
    statusBuilding: "正在构建工具栈...",
    statusRendering: "正在渲染流程图...",
    savePrompt: "保存此方案以获取永久链接",
    savePromptSub: "你可以分享、稍后查看或征求反馈",
    saveButton: "保存获取链接",
    saving: "保存中...",
    savedMessage: "已保存！你的方案有了永久链接：",
    copy: "复制",
    copyText: "复制文本",
    sharePrompt: "分享获取反馈：",
    copyMarkdown: "复制为 Markdown",
    copied: "已复制！",
    executionPlan: "执行计划",
    toolStack: "工具栈",
    watchOut: "注意事项",
    placeholderInit: "描述你想构建什么……例如：量化交易系统、客服机器人、RAG 知识库",
    placeholderFollowUp: "在这里输入你的回答……",
    followUpHint: "试试：\"换个更便宜的\" · \"加一个监控层\" · \"简化方案\"",
  },
} as const;

// S1: Lightweight analytics — blueprint funnel tracking
function trackEvent(event: string, props?: Record<string, string | number>) {
  try {
    // Use Vercel Web Analytics custom events if available
    if (typeof window !== "undefined" && (window as any).va) {
      (window as any).va("event", { name: event, ...props });
    }
    // Also log to console in dev for debugging
    if (process.env.NODE_ENV === "development") {
      console.log("[track]", event, props);
    }
  } catch {}
}

interface StackLayer {
  name: string;
  description: string;
  tools: Array<{
    tool_id: string;
    role: string;
    note: string;
    name?: string;
    stars?: number | null;
    pricing?: string;
  }>;
}

interface StackImpact {
  build_time: string;
  monthly_cost: string;
  replaces: string;
}

interface ExecutionStep {
  step: string;
  task: string;
  output: string;
  tools_used?: string[];
}

interface ParsedStack {
  title: string;
  icon: string;
  difficulty: string;
  project_tags?: string[];
  story?: string;
  impact?: StackImpact;
  execution_plan?: ExecutionStep[];
  failure_points?: string[];
  layers: StackLayer[];
}

// Extract full text content from UIMessage parts
function getMessageText(msg: { parts: Array<{ type: string; text?: string }> }): string {
  return msg.parts
    .filter((p) => p.type === "text" && p.text)
    .map((p) => p.text!)
    .join("");
}

function parseStackFromText(text: string): ParsedStack | null {
  // Try fenced JSON first (expected format)
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed.layers && Array.isArray(parsed.layers)) return parsed as ParsedStack;
    } catch {}
  }
  // Fallback: try to find raw JSON object with "layers" key (model skipped fences)
  const rawMatch = text.match(/\{[\s\S]*"layers"\s*:\s*\[[\s\S]*\][\s\S]*\}/);
  if (rawMatch) {
    try {
      const parsed = JSON.parse(rawMatch[0]);
      if (parsed.layers && Array.isArray(parsed.layers)) return parsed as ParsedStack;
    } catch {}
  }
  return null;
}

function getTextBeforeJson(text: string): string {
  // Try fenced JSON first
  const idx = text.indexOf("```json");
  if (idx !== -1) return text.slice(0, idx).trim();
  // Fallback: find raw JSON object start
  const rawIdx = text.search(/\{\s*"title"\s*:/);
  if (rawIdx !== -1) return text.slice(0, rawIdx).trim();
  return text;
}

function CopyMarkdownButton({ stack, locale = "en" }: { stack: ParsedStack; locale?: Locale }) {
  const [copied, setCopied] = useState(false);
  const s = t[locale];

  function toMarkdown(): string {
    let md = `## ${stack.icon} ${stack.title}\n\n`;
    for (const layer of stack.layers) {
      md += `### ${layer.name}\n${layer.description}\n\n`;
      for (const tool of layer.tools) {
        md += `- **${tool.role}**: [${tool.name || tool.tool_id}](https://agentoolrank.com/tool/${tool.tool_id}) — ${tool.note}\n`;
      }
      md += "\n";
    }
    return md;
  }

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(toMarkdown());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
    >
      {copied ? s.copied : s.copyMarkdown}
    </button>
  );
}

function StackActions({ stack, locale = "en" }: { stack: ParsedStack; locale?: Locale }) {
  const [saving, setSaving] = useState(false);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const s = t[locale];

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/save-stack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stack),
      });
      const data = await res.json();
      if (data.slug) {
        setSavedSlug(data.slug);
        trackEvent("blueprint_saved", { title: stack.title, slug: data.slug });
      }
    } catch {}
    setSaving(false);
  }

  const stackUrl = savedSlug ? `https://agentoolrank.com/stack/${savedSlug}` : null;

  // Short share text for Twitter (under 280 chars)
  const impact = stack.impact;
  const shortShare = impact
    ? `${stack.icon} ${stack.title}\n\n⏱ ${impact.build_time} | 💰 ${impact.monthly_cost} | 🔄 ${impact.replaces}\n\n${stackUrl || "agentoolrank.com/search"}`
    : `${stack.icon} ${stack.title}\n\n${stackUrl || "agentoolrank.com/search"}`;

  // Not saved yet — show save CTA with guidance
  if (!savedSlug) {
    return (
      <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">{s.savePrompt}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.savePromptSub}</p>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium shrink-0"
          >
            {saving ? s.saving : s.saveButton}
          </button>
        </div>
      </div>
    );
  }

  // Saved — show link + share options
  return (
    <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-green-600 text-sm">✓</span>
        <p className="text-sm font-medium text-gray-900">{s.savedMessage}</p>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <input
          type="text"
          readOnly
          value={stackUrl!}
          className="flex-1 text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-600"
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <button
          onClick={() => navigator.clipboard.writeText(stackUrl!)}
          className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shrink-0"
        >
          {s.copy}
        </button>
      </div>
      <div className="flex items-center gap-2">
        <p className="text-xs text-gray-500">{s.sharePrompt}</p>
        <div className="relative">
          <div className="flex items-center gap-1.5">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shortShare)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-2.5 py-1 bg-black text-white rounded hover:bg-gray-800 transition-colors"
            >
              𝕏
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(stackUrl!)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-2.5 py-1 bg-blue-700 text-white rounded hover:bg-blue-800 transition-colors"
            >
              in
            </a>
            <button
              onClick={() => navigator.clipboard.writeText(shortShare)}
              className="text-xs px-2.5 py-1 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
            >
              {s.copyText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImpactBar({ impact }: { impact: StackImpact }) {
  return (
    <div className="flex flex-wrap gap-4 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100 text-sm">
      <span className="flex items-center gap-1.5">
        <span className="text-blue-500">⏱</span>
        <span className="text-gray-500">Build:</span>
        <span className="font-medium text-gray-900">{impact.build_time}</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="text-green-500">💰</span>
        <span className="text-gray-500">Cost:</span>
        <span className="font-medium text-gray-900">{impact.monthly_cost}</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="text-purple-500">🔄</span>
        <span className="text-gray-500">Replaces:</span>
        <span className="font-medium text-gray-900">{impact.replaces}</span>
      </span>
    </div>
  );
}

const POPULAR_QUERIES_EN = [
  "Build a RAG chatbot",
  "AI code reviewer",
  "金融量化系统",
  "Customer service bot",
  "Multi-agent workflow",
  "AI content pipeline",
];

const POPULAR_QUERIES_ZH = [
  "RAG 聊天机器人",
  "AI 代码审查",
  "金融量化系统",
  "客服机器人",
  "多 Agent 协作",
  "AI 内容生产管线",
];

interface QuickResult {
  tools: Array<{ id: string; name: string; tagline: string; pricing: string; github_stars: number }>;
  stacks: Array<{ slug: string; title: string; description: string; icon: string }>;
}

export function AISearch({ initialQuery, locale = "en" }: { initialQuery?: string; locale?: Locale }) {
  const s = t[locale];
  const POPULAR_QUERIES = locale === "zh" ? POPULAR_QUERIES_ZH : POPULAR_QUERIES_EN;
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasSentInitial = useRef(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [quickResults, setQuickResults] = useState<QuickResult | null>(null);

  const [localInput, setLocalInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onFinish: () => {
      // Persist completed conversations to localStorage
      try {
        const key = "ai-builder-history";
        const existing = JSON.parse(localStorage.getItem(key) || "[]");
        // Keep last 5 conversations
        const updated = [
          { ts: Date.now(), query: initialQuery || "", messagesCount: messages.length + 1 },
          ...existing,
        ].slice(0, 5);
        localStorage.setItem(key, JSON.stringify(updated));
      } catch {}
    },
  });

  const isStreaming = status === "streaming" || status === "submitted";

  // Quick search — fires immediately, shows results before AI responds
  async function quickSearch(query: string) {
    try {
      const res = await fetch(`/api/quick-search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setQuickResults(data);
    } catch {
      setQuickResults(null);
    }
  }

  // Auto-send initial query (only once, survives re-renders and back navigation)
  useEffect(() => {
    if (initialQuery && !hasSentInitial.current && !hasInteracted && messages.length === 0) {
      hasSentInitial.current = true;
      setHasInteracted(true);
      quickSearch(initialQuery);
      sendMessage({ text: initialQuery });
    }
  }, [initialQuery, hasInteracted, messages.length, sendMessage]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!localInput.trim() || isStreaming) return;
    setHasInteracted(true);
    quickSearch(localInput);
    sendMessage({ text: localInput });
    setLocalInput("");
  }

  function handlePopularClick(query: string) {
    setHasInteracted(true);
    quickSearch(query);
    sendMessage({ text: query });
  }

  const hasMessages = messages.length > 0;
  const inputPlaceholder = hasMessages
    ? s.placeholderFollowUp
    : s.placeholderInit;

  const inputForm = (
    <form onSubmit={onSubmit} className={hasMessages ? "sticky bottom-0 bg-white pt-3 pb-2 border-t border-gray-100 z-10" : "mb-6"}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={localInput}
          onChange={(e) => setLocalInput(e.target.value)}
          placeholder={inputPlaceholder}
          className={`w-full px-5 pr-24 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm ${
            hasMessages ? "py-3 text-base" : "py-4 text-lg"
          }`}
          disabled={isStreaming}
          autoFocus={!initialQuery}
        />
        <button
          type="submit"
          disabled={isStreaming || !localInput.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 transition-colors font-medium"
        >
          {isStreaming ? s.thinking : s.send}
        </button>
      </div>
    </form>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Input at top — only before conversation starts */}
      {!hasMessages && inputForm}

      {/* Popular queries — show before first interaction */}
      {!hasInteracted && messages.length === 0 && (
        <div className="mb-8">
          <p className="text-sm text-gray-500 mb-3">{s.popular}</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => handlePopularClick(q)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-full hover:border-blue-300 hover:bg-blue-50/50 transition-colors text-gray-600 hover:text-blue-700"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick search results — shown while AI is thinking */}
      {quickResults && isStreaming && messages.length <= 2 && (
        <div className="mb-6">
          {quickResults.stacks.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-2">{s.existingStacks}</p>
              <div className="flex flex-wrap gap-2">
                {quickResults.stacks.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/stack/${s.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                  >
                    <span>{s.icon}</span>
                    <span className="text-gray-700">{s.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {quickResults.tools.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">{s.relatedTools}</p>
              <div className="flex flex-wrap gap-1.5">
                {quickResults.tools.slice(0, 8).map((t) => (
                  <Link
                    key={t.id}
                    href={`/tool/${t.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-2 py-1 border border-gray-200 rounded-md hover:border-blue-300 text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    {t.name}
                    {t.github_stars > 0 && (
                      <span className="text-gray-400 ml-1">
                        {t.github_stars >= 1000 ? `${(t.github_stars / 1000).toFixed(0)}k` : t.github_stars}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="space-y-6">
        {messages.map((msg) => {
          const text = getMessageText(msg as any);

          if (msg.role === "user") {
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[80%] px-4 py-2.5 bg-blue-600 text-white rounded-2xl rounded-br-md text-sm">
                  {text}
                </div>
              </div>
            );
          }

          // Assistant message
          const stack = parseStackFromText(text);
          const overview = getTextBeforeJson(text);
          // Story comes AFTER the JSON block in the AI output
          const afterJson = text.includes("```") ? text.split(/```(?:json)?[\s\S]*?```/).pop()?.trim() : "";
          // S1: Track blueprint generation
          if (stack && msg.id) {
            trackEvent("blueprint_generated", { title: stack.title, layers: stack.layers.length });
          }

          return (
            <div key={msg.id} className="space-y-4">
              {/* Brief intro (before JSON) — only if short, like "Based on your requirements..." */}
              {overview && overview.length < 200 && (
                <div className="text-gray-700 text-sm leading-relaxed">
                  {overview}
                </div>
              )}

              {/* If no stack parsed, show full overview as regular text */}
              {!stack && overview && overview.length >= 200 && (
                <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {overview}
                </div>
              )}

              {/* Stack visualization */}
              {stack && (
                <div className="border border-gray-200 rounded-xl p-5">
                  {/* Header + tags */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{stack.icon}</span>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {stack.title}
                      </h3>
                    </div>
                    <CopyMarkdownButton stack={stack} locale={locale} />
                  </div>

                  {/* Project tags */}
                  {stack.project_tags && stack.project_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {stack.project_tags.map((tag) => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Impact bar */}
                  {stack.impact && <ImpactBar impact={stack.impact} />}

                  {/* Execution Plan */}
                  {stack.execution_plan && stack.execution_plan.length > 0 && (
                    <div className="mt-4 mb-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">{s.executionPlan}</h4>
                      <div className="space-y-2">
                        {stack.execution_plan.map((step, i) => (
                          <div key={i} className="flex gap-3 text-sm">
                            <div className="shrink-0 w-16 font-mono text-xs text-blue-600 font-medium pt-0.5">
                              {step.step}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-800">{step.task}</p>
                              <p className="text-xs text-gray-400 mt-0.5">Output: {step.output}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tool Stack */}
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">{s.toolStack}</h4>
                    <StackFlow layers={stack.layers} />
                  </div>

                  {/* Failure Points */}
                  {stack.failure_points && stack.failure_points.length > 0 && (
                    <div className="mt-4 p-3 bg-red-50/50 border border-red-100 rounded-lg">
                      <h4 className="text-sm font-semibold text-red-800 mb-1.5">{s.watchOut}</h4>
                      <ul className="space-y-1">
                        {stack.failure_points.map((fp, i) => (
                          <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                            <span className="shrink-0 mt-0.5">⚠️</span>
                            <span>{fp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Summary — after everything */}
                  {afterJson && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-sm text-gray-700 leading-relaxed">{afterJson}</p>
                    </div>
                  )}

                  {/* Save + Share */}
                  <StackActions stack={stack} locale={locale} />
                </div>
              )}
            </div>
          );
        })}

        {/* Streaming status indicator */}
        {isStreaming && messages.length > 0 && (() => {
          const lastMsg = messages[messages.length - 1];
          const lastText = lastMsg?.role === "assistant" ? getMessageText(lastMsg as any) : "";
          const hasJson = lastText.includes("```json");
          const jsonComplete = lastText.includes("```json") && lastText.split("```").length > 2;

          let statusText: string = s.statusAnalyzing;
          let statusIcon = "🔍";
          if (lastText.length > 0 && !hasJson) {
            statusText = s.statusSelecting;
            statusIcon = "🧠";
          } else if (hasJson && !jsonComplete) {
            statusText = s.statusBuilding;
            statusIcon = "🔧";
          } else if (jsonComplete) {
            statusText = s.statusRendering;
            statusIcon = "📊";
          }

          return (
            <div className="flex items-center gap-2.5 py-2 px-3 bg-blue-50/50 rounded-lg border border-blue-100">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
              <span className="text-sm text-blue-700">
                {statusIcon} {statusText}
              </span>
            </div>
          );
        })()}

        <div ref={messagesEndRef} />
      </div>

      {/* Follow-up hint — show after first response */}
      {messages.length >= 2 && !isStreaming && (
        <div className="mt-4 mb-2 text-center">
          <p className="text-xs text-gray-400">
            {s.followUpHint}
          </p>
        </div>
      )}

      {/* Input at bottom — during conversation (sticky, like a chat app) */}
      {hasMessages && inputForm}
    </div>
  );
}
