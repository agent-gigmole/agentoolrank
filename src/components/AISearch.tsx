"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect } from "react";
import { StackFlow } from "./StackFlow";
import Link from "next/link";

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
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[1]);
    if (parsed.layers && Array.isArray(parsed.layers)) {
      return parsed as ParsedStack;
    }
  } catch {}
  return null;
}

function getTextBeforeJson(text: string): string {
  const idx = text.indexOf("```json");
  if (idx === -1) return text;
  return text.slice(0, idx).trim();
}

function CopyMarkdownButton({ stack }: { stack: ParsedStack }) {
  const [copied, setCopied] = useState(false);

  function toMarkdown(): string {
    let md = `## ${stack.icon} ${stack.title}\n\n`;
    for (const layer of stack.layers) {
      md += `### ${layer.name}\n${layer.description}\n\n`;
      for (const t of layer.tools) {
        md += `- **${t.role}**: [${t.name || t.tool_id}](https://agentoolrank.com/tool/${t.tool_id}) — ${t.note}\n`;
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
      {copied ? "Copied!" : "Copy as Markdown"}
    </button>
  );
}

function StackActions({ stack }: { stack: ParsedStack }) {
  const [saving, setSaving] = useState(false);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);

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
            <p className="text-sm font-medium text-gray-900">Save this stack to get a permanent link</p>
            <p className="text-xs text-gray-500 mt-0.5">You can share it, come back to it later, or ask others for feedback</p>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium shrink-0"
          >
            {saving ? "Saving..." : "Save & Get Link"}
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
        <p className="text-sm font-medium text-gray-900">Saved! Your stack has a permanent link:</p>
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
          Copy
        </button>
      </div>
      <div className="flex items-center gap-2">
        <p className="text-xs text-gray-500">Share to get feedback:</p>
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
              Copy text
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

const POPULAR_QUERIES = [
  "Build a RAG chatbot",
  "AI code reviewer",
  "金融量化系统",
  "Customer service bot",
  "Multi-agent workflow",
  "AI content pipeline",
];

interface QuickResult {
  tools: Array<{ id: string; name: string; tagline: string; pricing: string; github_stars: number }>;
  stacks: Array<{ slug: string; title: string; description: string; icon: string }>;
}

export function AISearch({ initialQuery }: { initialQuery?: string }) {
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
    ? "Type your answer here... 在这里回答"
    : "Describe what you want to build... e.g. 我想做金融量化系统";

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
          {isStreaming ? "Thinking..." : "Send"}
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
          <p className="text-sm text-gray-500 mb-3">Popular searches:</p>
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
              <p className="text-xs text-gray-400 mb-2">Existing stacks that might help:</p>
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
              <p className="text-xs text-gray-400 mb-2">Related tools:</p>
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
                    <CopyMarkdownButton stack={stack} />
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
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Execution Plan</h4>
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
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Tool Stack</h4>
                    <StackFlow layers={stack.layers} />
                  </div>

                  {/* Failure Points */}
                  {stack.failure_points && stack.failure_points.length > 0 && (
                    <div className="mt-4 p-3 bg-red-50/50 border border-red-100 rounded-lg">
                      <h4 className="text-sm font-semibold text-red-800 mb-1.5">Watch Out</h4>
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
                  <StackActions stack={stack} />
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

          let statusText = "Analyzing your requirements...";
          let statusIcon = "🔍";
          if (lastText.length > 0 && !hasJson) {
            statusText = "Selecting tools from 463 options...";
            statusIcon = "🧠";
          } else if (hasJson && !jsonComplete) {
            statusText = "Building your tool stack...";
            statusIcon = "🔧";
          } else if (jsonComplete) {
            statusText = "Rendering flow diagram...";
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
            Try: "换个更便宜的" · "Add a monitoring layer" · "Make it simpler"
          </p>
        </div>
      )}

      {/* Input at bottom — during conversation (sticky, like a chat app) */}
      {hasMessages && inputForm}
    </div>
  );
}
