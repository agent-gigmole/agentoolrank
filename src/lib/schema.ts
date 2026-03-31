import { z } from "zod";

// === Tool Schema (shared between pipeline and UI) ===

export const ToolSourceEnum = z.enum([
  "github",
  "producthunt",
  "awesome-list",
  "manual",
]);

export const PricingEnum = z.enum([
  "free",
  "freemium",
  "paid",
  "open-source",
]);

export const ContentStatusEnum = z.enum([
  "pending",
  "partial",
  "complete",
]);

export const ToolSchema = z.object({
  id: z.string().min(1), // slug: "langchain"
  name: z.string().min(1),
  tagline: z.string().default(""),
  description: z.string().default(""),
  logo_url: z.string().default(""),
  website_url: z.string().url().or(z.literal("")),
  github_url: z.string().url().optional(),

  // Dual-axis classification
  category_tags: z.array(z.string()).default([]),
  industry_tags: z.array(z.string()).default([]),

  // GitHub metrics (nullable for non-open-source tools)
  github_stars: z.number().nullable().default(null),
  star_velocity_30d: z.number().nullable().default(null),
  last_commit_date: z.string().nullable().default(null),
  commit_count_90d: z.number().nullable().default(null),
  release_count_6m: z.number().nullable().default(null),
  npm_downloads_weekly: z.number().nullable().default(null),
  issue_response_hours: z.number().nullable().default(null),
  docs_status: z.enum(["ok", "404", "unknown"]).default("unknown"),

  // LLM-generated content
  pros: z.array(z.string()).default([]),
  cons: z.array(z.string()).default([]),
  use_cases: z.array(z.string()).default([]),
  getting_started: z.string().default(""),

  // Relationships (v2 Stack Graph prep)
  related_tools: z.array(z.string()).default([]),
  alternatives: z.array(z.string()).default([]),
  integrations: z.array(z.string()).default([]),

  // Metadata
  source: ToolSourceEnum,
  pricing: PricingEnum,
  affiliate_url: z.string().url().nullish(),
  content_status: ContentStatusEnum.default("pending"),

  // Ranking
  score: z.number().default(0),
  percentile_rank: z.number().nullable().default(null),

  created_at: z.string(),
  updated_at: z.string(),
  data_refreshed_at: z.string(),
});

export type Tool = z.infer<typeof ToolSchema>;

// === Category Schema ===

export const CategorySchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  icon: z.string().default(""), // emoji or icon name
  tool_count: z.number().default(0),
});

export type Category = z.infer<typeof CategorySchema>;

// === Metric Snapshot (for historical tracking) ===

export const MetricSnapshotSchema = z.object({
  tool_id: z.string(),
  date: z.string(), // YYYY-MM-DD
  github_stars: z.number().nullable(),
  commit_count_90d: z.number().nullable(),
  release_count_6m: z.number().nullable(),
  npm_downloads_weekly: z.number().nullable(),
});

export type MetricSnapshot = z.infer<typeof MetricSnapshotSchema>;

// === Search Index (lightweight for client-side) ===

export const SearchItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  tagline: z.string(),
  category_tags: z.array(z.string()),
  pricing: PricingEnum,
  github_stars: z.number().nullable(),
  score: z.number(),
});

export type SearchItem = z.infer<typeof SearchItemSchema>;
