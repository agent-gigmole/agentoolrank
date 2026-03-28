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

interface ParsedStack {
  title: string;
  icon: string;
  difficulty: string;
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

function SaveStackButton({ stack, onSaved }: { stack: ParsedStack; onSaved?: (slug: string) => void }) {
  const [saving, setSaving] = useState(false);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);

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
        onSaved?.(data.slug);
      }
    } catch {}
    setSaving(false);
  }

  if (savedSlug) {
    return (
      <Link
        href={`/stack/${savedSlug}`}
        className="text-xs px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
      >
        Saved! View →
      </Link>
    );
  }

  return (
    <button
      onClick={save}
      disabled={saving}
      className="text-xs px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
    >
      {saving ? "Saving..." : "Save Stack"}
    </button>
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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Input area */}
      <form onSubmit={onSubmit} className="mb-6">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={localInput}
            onChange={(e) => setLocalInput(e.target.value)}
            placeholder="Describe what you want to build... e.g. 我想做金融量化系统"
            className="w-full px-5 py-4 pr-24 border border-gray-300 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            disabled={isStreaming}
            autoFocus={!initialQuery}
          />
          <button
            type="submit"
            disabled={isStreaming || !localInput.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 transition-colors font-medium"
          >
            {isStreaming ? "Thinking..." : "Go"}
          </button>
        </div>
      </form>

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

          return (
            <div key={msg.id} className="space-y-4">
              {/* Overview text */}
              {overview && (
                <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {overview}
                </div>
              )}

              {/* Stack visualization */}
              {stack && (
                <div className="border border-gray-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{stack.icon}</span>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {stack.title}
                      </h3>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                        AI Generated
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CopyMarkdownButton stack={stack} />
                      <SaveStackButton stack={stack} />
                    </div>
                  </div>
                  <StackFlow layers={stack.layers} />
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
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            Try: "换个更便宜的" · "Add a monitoring layer" · "Make it simpler"
          </p>
        </div>
      )}
    </div>
  );
}
