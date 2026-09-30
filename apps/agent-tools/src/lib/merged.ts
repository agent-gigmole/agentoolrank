// Duplicate tool entries merged on 2026-10-01 (owner-approved). Old URLs 301 to the kept entry.
export const MERGED: Record<string, string> = {
  embedchain: "mem0",
  "gpt-index": "llama-index",
  memgpt: "letta",
  opendevin: "openhands",
  "agent-llm": "agixt",
  quiver: "quivr",
  autogpt: "auto-gpt",
  privategpt: "private-gpt",
};

export function canonicalToolId(id: string): string {
  return MERGED[id] ?? id;
}

export function mergedRedirects() {
  return Object.entries(MERGED).flatMap(([from, to]) => [
    { source: `/tool/${from}`, destination: `/tool/${to}`, permanent: true },
    { source: `/alternatives/${from}`, destination: `/alternatives/${to}`, permanent: true },
  ]);
}
