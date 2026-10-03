"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { SEEN_RATIO, clickLabel, firstSighting, scrollPercent, sourceFromUrl, type EventName } from "@/lib/events";

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

/**
 * Our own traffic never sends events: ?internal=1 marks this browser as ours (sessionStorage + a localStorage flag
 * that holds only "1", no id), so one visit per agent browser excludes it for good; ?internal=0 clears the mark.
 */
function internal(): boolean {
  try {
    const q = /(?:^|[?&])internal=([01])(?:&|$)/.exec(location.search)?.[1];
    for (const store of [sessionStorage, localStorage]) {
      if (q === "1") store.setItem("at_internal", "1");
      if (q === "0") store.removeItem("at_internal");
    }
    return sessionStorage.getItem("at_internal") === "1" || localStorage.getItem("at_internal") === "1";
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
      maxScroll = Math.max(maxScroll, scrollPercent(window.scrollY, document.documentElement.scrollHeight, window.innerHeight));
    };
    // Measure once after layout: a page that fits on screen never fires scroll and counts as 100%.
    const firstMeasure = requestAnimationFrame(onScroll);
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
      cancelAnimationFrame(firstMeasure);
      flush(); // tagged with this effect's pathname, so a client-side route change never credits the next page
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
    };
  }, [pathname]);

  // element_seen: key buttons marked data-vi-seen="name" that were at least half on screen, once per session per name
  // (so the funnel can tell "never reached the button" from "saw it and didn't press").
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const name = (e.target as HTMLElement).dataset.viSeen;
          if (!name || !e.isIntersecting) continue;
          try {
            if (firstSighting(name, e.intersectionRatio, sessionStorage)) track("element_seen", location.pathname, { element: name });
          } catch {
            /* private mode */
          }
          if (e.intersectionRatio >= SEEN_RATIO) io.unobserve(e.target);
        }
      },
      { threshold: [SEEN_RATIO] },
    );
    const watched = new WeakSet<Element>();
    const scan = () =>
      document.querySelectorAll("[data-vi-seen]").forEach((el) => {
        if (!watched.has(el)) {
          watched.add(el);
          io.observe(el);
        }
      });
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      io.disconnect();
    };
  }, [pathname]);

  useEffect(() => {
    function onClick(ev: MouseEvent) {
      const a = (ev.target as HTMLElement | null)?.closest?.("a");
      if (a && a.host && a.host !== location.host) track("outbound_click", `${location.pathname} -> ${a.hostname}`);
      const el = (ev.target as HTMLElement | null)?.closest?.("a,button") as HTMLElement | null;
      if (el) {
        const label = clickLabel(el.getAttribute("data-testid"), el.getAttribute("href"), location.origin);
        if (label) track("ui_click", location.pathname, { label });
      }
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
