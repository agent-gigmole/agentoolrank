"use client";

import { useState, useEffect } from "react";
import { StackFlow } from "./StackFlow";

interface StackTool {
  tool_id: string;
  role: string;
  note: string;
  name?: string;
  stars?: number | null;
  pricing?: string;
}

interface StackLayer {
  name: string;
  description: string;
  tools: StackTool[];
}

interface Stack {
  slug: string;
  title: string;
  description: string;
  icon: string;
  difficulty: string;
  layers: StackLayer[];
}

export function StackGenerator({ query }: { query: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [stack, setStack] = useState<Stack | null>(null);

  async function generate() {
    setStatus("loading");
    try {
      const res = await fetch("/api/generate-stack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (data.stacks?.length > 0) {
        setStack(data.stacks[0]);
        setStatus("done");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "idle") {
    return (
      <div className="border border-dashed border-blue-300 rounded-xl p-6 text-center bg-blue-50/30">
        <p className="text-gray-600 mb-3">
          No pre-built stack matches your query. Want us to generate a custom one?
        </p>
        <button
          onClick={generate}
          className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Generate Custom Stack
        </button>
        <p className="text-xs text-gray-400 mt-2">Powered by AI — takes a few seconds</p>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="border border-gray-200 rounded-xl p-8 text-center">
        <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-gray-600">Generating custom tool stack for your query...</p>
        <p className="text-xs text-gray-400 mt-1">Analyzing 463 tools to find the best combination</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="border border-gray-200 rounded-xl p-6 text-center">
        <p className="text-gray-500">Could not generate a stack. Try rephrasing your query.</p>
      </div>
    );
  }

  if (stack) {
    return (
      <div className="border border-blue-200 rounded-xl p-5 bg-blue-50/20">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">{stack.icon}</span>
          <h3 className="text-lg font-semibold text-gray-900">{stack.title}</h3>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
            AI Generated
          </span>
        </div>
        <p className="text-sm text-gray-500 mb-4">{stack.description}</p>
        <StackFlow layers={stack.layers} />
      </div>
    );
  }

  return null;
}
