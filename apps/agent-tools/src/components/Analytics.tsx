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

/** Our own traffic: any tab that once opened a page with ?internal=1 (sticks for the tab) never sends events. */
function internal(): boolean {
  try {
    if (/(^|[?&])internal=1(&|$)/.test(location.search)) sessionStorage.setItem("at_internal", "1");
    return sessionStorage.getItem("at_internal") === "1";
  } catch {
    return false;
  }
}

export function track(name: EventName, path?: string, props?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined" || navigator.webdriver || internal()) return;
  const { sid, src } = session();
  const body = JSON.stringify({ n: name, p: path ?? location.pathname, r: document.referrer, s: src, sid, props });
  if (!navigator.sendBeacon?.("/api/e", body)) {
    fetch("/api/e", { method: "POST", body, keepalive: true }).catch(() => {});
  }
}

/**
 * Sends a page_view on every route change, outbound_click for links leaving the site, and the visitor-insights
 * events (agentkit skills/visitor-insights): one engagement per page (seconds visible, max scroll %) and
 * ui_click with a data-testid or internal path only. No cookies; the session id lives in sessionStorage.
 */
export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    let touch = false;
    try {
      touch = window.matchMedia("(pointer: coarse)").matches;
    } catch {
      /* old browsers */
    }
    track("page_view", pathname, { touch });

    const start = Date.now();
    let maxScroll = 0;
    let sent = false;
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      maxScroll = Math.max(maxScroll, Math.min(100, h > 0 ? Math.round((window.scrollY / h) * 100) : 100));
    };
    const flush = () => {
      if (sent) return;
      sent = true;
      track("engagement", pathname, { seconds: Math.round((Date.now() - start) / 1000), scroll: maxScroll });
    };
    const onVisibility = () => document.visibilityState === "hidden" && flush();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    return () => {
      flush();
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
    };
  }, [pathname]);

  useEffect(() => {
    function onClick(ev: MouseEvent) {
      const a = (ev.target as HTMLElement | null)?.closest?.("a");
      if (a && a.host && a.host !== location.host) track("outbound_click", `${location.pathname} -> ${a.hostname}`);
      const el = (ev.target as HTMLElement | null)?.closest?.("a,button") as HTMLElement | null;
      if (el) {
        const id = el.getAttribute("data-testid");
        const href = el.getAttribute("href");
        const label = id || (href?.startsWith("/") ? href.split(/[?#]/)[0] : href ? "external" : "");
        if (label) track("ui_click", location.pathname, { label });
      }
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
