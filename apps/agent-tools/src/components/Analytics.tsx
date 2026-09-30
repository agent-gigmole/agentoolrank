"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { sourceFromUrl, type EventName } from "@/lib/events";

function session(): { sid: string; src: string } {
  try {
    let sid = sessionStorage.getItem("at_sid");
    if (!sid) {
      sid = Math.random().toString(36).slice(2, 12);
      sessionStorage.setItem("at_sid", sid);
    }
    const fromUrl = sourceFromUrl(location.href);
    if (fromUrl) sessionStorage.setItem("at_src", fromUrl);
    return { sid, src: sessionStorage.getItem("at_src") ?? "" };
  } catch {
    return { sid: "", src: "" };
  }
}

export function track(name: EventName, path?: string) {
  if (typeof window === "undefined" || navigator.webdriver) return;
  const { sid, src } = session();
  const body = JSON.stringify({ n: name, p: path ?? location.pathname, r: document.referrer, s: src, sid });
  if (!navigator.sendBeacon?.("/api/e", body)) {
    fetch("/api/e", { method: "POST", body, keepalive: true }).catch(() => {});
  }
}

/** Sends a page_view on every route change, and outbound_click for links leaving the site. */
export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    track("page_view", pathname);
  }, [pathname]);

  useEffect(() => {
    function onClick(ev: MouseEvent) {
      const a = (ev.target as HTMLElement | null)?.closest?.("a");
      if (a && a.host && a.host !== location.host) track("outbound_click", `${location.pathname} -> ${a.hostname}`);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
