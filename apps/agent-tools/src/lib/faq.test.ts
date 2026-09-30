import { describe, it, expect } from "vitest";
import { alternativesFaq, compareFaq, faqJsonLd } from "./faq";

const t = (id: string, name: string, stars: number | null, commits: number | null, last: string | null) =>
  ({ id, name, github_stars: stars, commit_count_90d: commits, last_commit_date: last }) as never;

describe("alternativesFaq", () => {
  const faq = alternativesFaq(t("dify", "Dify", 150000, 300, "2026-09-30"), [t("flowise", "Flowise", 40000, 90, "2026-09-29"), t("langflow", "Langflow", 90000, 400, "2026-09-30"), t("n8n", "n8n", 160000, 500, "2026-09-30")]);
  it("names the top alternatives in order", () => {
    expect(faq[0].q).toBe("What are the best alternatives to Dify?");
    expect(faq[0].a).toContain("Flowise, Langflow and n8n");
  });
  it("reports the most-starred and most active alternative from data", () => {
    expect(faq.find((f) => f.q.includes("most popular"))?.a).toContain("n8n");
    expect(faq.find((f) => f.q.includes("most actively"))?.a).toContain("n8n (500 commits in the last 90 days)");
  });
});

describe("compareFaq", () => {
  const faq = compareFaq(t("a", "Claude Code", 149000, 800, "2026-09-30"), t("b", "Codex", 127000, 1200, "2026-09-30"));
  it("answers popularity and activity from GitHub data", () => {
    expect(faq[0].a).toContain("Claude Code has more GitHub stars (149,000 vs 127,000)");
    expect(faq[1].a).toContain("Codex had more commits in the last 90 days (1,200 vs 800)");
  });
  it("skips questions when data is missing", () => {
    expect(compareFaq(t("a", "A", null, null, null), t("b", "B", null, null, null))).toHaveLength(1);
  });
});

describe("faqJsonLd", () => {
  it("builds FAQPage structured data", () => {
    const j = faqJsonLd([{ q: "Q?", a: "A." }]);
    expect(j).toMatchObject({ "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: "Q?", acceptedAnswer: { "@type": "Answer", text: "A." } }] });
  });
});
