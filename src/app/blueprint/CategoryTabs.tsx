"use client";

import { useState, useEffect, useRef } from "react";

interface Tab {
  name: string;
  slug: string;
  icon: string;
  count: number;
}

export function CategoryTabs({
  categories,
  hasCommunity,
  communityCount,
}: {
  categories: Tab[];
  hasCommunity: boolean;
  communityCount: number;
}) {
  const [active, setActive] = useState(categories[0]?.slug || "");
  const tabsRef = useRef<HTMLDivElement>(null);

  // Track which section is visible
  useEffect(() => {
    const slugs = [...categories.map((c) => c.slug), ...(hasCommunity ? ["community"] : [])];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: "-100px 0px -60% 0px", threshold: 0 }
    );

    for (const slug of slugs) {
      const el = document.getElementById(slug);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [categories, hasCommunity]);

  function scrollTo(slug: string) {
    const el = document.getElementById(slug);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActive(slug);
    }
  }

  const allTabs = [
    ...categories,
    ...(hasCommunity ? [{ name: "Community", slug: "community", icon: "👥", count: communityCount }] : []),
  ];

  return (
    <div
      ref={tabsRef}
      className="sticky top-14 z-10 -mx-4 px-4 py-3 bg-white/95 backdrop-blur-sm border-b border-gray-100 mb-8"
    >
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {allTabs.map((tab) => (
          <button
            key={tab.slug}
            onClick={() => scrollTo(tab.slug)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
              active === tab.slug
                ? "bg-gray-900 text-white font-medium"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span className="text-xs">{tab.icon}</span>
            <span>{tab.name}</span>
            <span className={`text-[10px] ${active === tab.slug ? "text-gray-400" : "text-gray-400"}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
