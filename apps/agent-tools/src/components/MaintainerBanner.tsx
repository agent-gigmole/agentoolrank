"use client";

import { useEffect, useState } from "react";
import { track } from "@/components/Analytics";

/** Maintainers arriving from our outreach email (?ref=outreach) get a pointer to the maintainer box at the top of the page. */
export function MaintainerBanner({ name }: { name: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("ref") === "outreach") setShow(true);
  }, []);
  if (!show) return null;
  return (
    <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-gray-800">
      Maintain {name}? Grab the README badge or feature it on the homepage.{" "}
      <a href="#maintainers" onClick={() => track("maintainer_banner_click", window.location.pathname)} className="font-medium text-blue-700 underline">
        Maintainer options ↓
      </a>
    </div>
  );
}
