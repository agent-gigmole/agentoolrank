"use client";
import { useState } from "react";

export function KeyButton() {
  const [key, setKey] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function create() {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/keys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ src: "api-key-page" }) });
      const data = await res.json();
      if (data.key) setKey(data.key);
      else setErr(data.error ?? "Could not create a key.");
    } catch {
      setErr("Network error, please try again.");
    }
    setBusy(false);
  }
  if (key)
    return (
      <div className="border border-green-200 bg-green-50 rounded-lg p-4 mb-6">
        <p className="text-sm text-green-900 font-medium mb-2">Your key (shown once — copy it now):</p>
        <code className="block text-sm break-all bg-white border rounded p-2 mb-2" data-testid="api-key-value">{key}</code>
        <button type="button" onClick={() => navigator.clipboard.writeText(key)} className="text-sm text-blue-700 hover:underline">Copy</button>
      </div>
    );
  return (
    <div className="mb-6">
      <button type="button" onClick={create} disabled={busy} data-testid="api-key-create" data-vi-seen="api_key_button"
        className="px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-60">
        {busy ? "Creating…" : "Create a free API key"}
      </button>
      {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
    </div>
  );
}
