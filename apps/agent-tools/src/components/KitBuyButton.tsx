"use client";
import { useState } from "react";
import { track } from "@/components/Analytics";

export function KitBuyButton({ price }: { price: number }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function buy() {
    setBusy(true);
    setErr("");
    track("checkout_click", "/submit-kit");
    try {
      // Session source (?ref= / utm, saved by Analytics) so a Kit sale shows which entry brought the buyer.
      let from = "";
      try {
        from = sessionStorage.getItem("at_src") ?? "";
      } catch {}
      const res = await fetch("/api/kit-checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ src: from ? `submit-kit-page|${from}` : "submit-kit-page" }) });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; return; }
      setErr(data.error ?? "Could not start checkout.");
    } catch {
      setErr("Network error, please try again.");
    }
    setBusy(false);
  }
  return (
    <div className="mb-6">
      <button type="button" onClick={buy} disabled={busy} data-testid="kit-buy" data-vi-seen="kit_buy_button" className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
        Get the full list · ${price} one-time
      </button>
      {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
    </div>
  );
}
