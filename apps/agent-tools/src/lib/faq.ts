// Data-backed FAQs for alternatives and comparison pages (visible on page + FAQPage JSON-LD).
// Every answer is derived from GitHub metrics we track; no hand-written claims.
import type { Tool } from "@repo/db/schema";

export interface Faq {
  q: string;
  a: string;
}

const n = (x: number) => x.toLocaleString("en-US");
const list = (names: string[]) => (names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`);

export function alternativesFaq(tool: Tool, alts: Tool[]): Faq[] {
  const out: Faq[] = [];
  if (alts.length === 0) return out;
  out.push({
    q: `What are the best alternatives to ${tool.name}?`,
    a: `The closest open-source alternatives to ${tool.name} are ${list(alts.slice(0, 3).map((a) => a.name))}${alts.length > 3 ? `, followed by ${list(alts.slice(3, 6).map((a) => a.name))}` : ""}. They are ranked by how closely they match what ${tool.name} does.`,
  });
  const starred = alts.filter((a) => a.github_stars != null).sort((x, y) => (y.github_stars ?? 0) - (x.github_stars ?? 0))[0];
  if (starred) out.push({ q: `Which ${tool.name} alternative is the most popular?`, a: `${starred.name} has the most GitHub stars among ${tool.name} alternatives, with ${n(starred.github_stars!)} stars.` });
  const active = alts.filter((a) => a.commit_count_90d != null).sort((x, y) => (y.commit_count_90d ?? 0) - (x.commit_count_90d ?? 0))[0];
  if (active) out.push({ q: `Which ${tool.name} alternative is the most actively maintained?`, a: `By recent activity, ${active.name} (${n(active.commit_count_90d!)} commits in the last 90 days) is the most actively developed alternative.` });
  return out;
}

export function compareFaq(a: Tool, b: Tool): Faq[] {
  const out: Faq[] = [];
  if (a.github_stars != null && b.github_stars != null) {
    const [hi, lo] = a.github_stars >= b.github_stars ? [a, b] : [b, a];
    out.push({ q: `Which is more popular, ${a.name} or ${b.name}?`, a: `${hi.name} has more GitHub stars (${n(hi.github_stars!)} vs ${n(lo.github_stars!)}).` });
  }
  if (a.commit_count_90d != null && b.commit_count_90d != null) {
    const [hi, lo] = a.commit_count_90d >= b.commit_count_90d ? [a, b] : [b, a];
    out.push({ q: `Which is more actively developed, ${a.name} or ${b.name}?`, a: `${hi.name} had more commits in the last 90 days (${n(hi.commit_count_90d!)} vs ${n(lo.commit_count_90d!)}).` });
  }
  out.push({ q: `Should I use ${a.name} or ${b.name}?`, a: `Compare their capabilities, limitations and "best for" notes above. Both are open source, so trying each on a small task is the fastest way to decide.` });
  return out;
}

export function faqJsonLd(faq: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}
