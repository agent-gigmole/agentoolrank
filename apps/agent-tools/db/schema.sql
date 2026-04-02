-- AI Directory Database Schema (Turso/SQLite)

CREATE TABLE IF NOT EXISTS tools (
  id TEXT PRIMARY KEY,              -- slug: "langchain"
  name TEXT NOT NULL,
  tagline TEXT DEFAULT '',
  description TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  website_url TEXT DEFAULT '',
  github_url TEXT,
  github_owner TEXT,                -- extracted from github_url for slug collision avoidance
  github_repo TEXT,

  -- Classification
  category_tags TEXT DEFAULT '[]',  -- JSON array
  industry_tags TEXT DEFAULT '[]',  -- JSON array

  -- GitHub metrics (NULL for non-open-source)
  github_stars INTEGER,
  star_velocity_30d REAL,
  last_commit_date TEXT,
  commit_count_90d INTEGER,
  release_count_6m INTEGER,
  npm_downloads_weekly INTEGER,
  issue_response_hours REAL,     -- median hours to close recent issues
  docs_status TEXT DEFAULT 'unknown',  -- 'ok' | '404' | 'unknown'

  -- LLM content
  pros TEXT DEFAULT '[]',           -- JSON array
  cons TEXT DEFAULT '[]',           -- JSON array
  use_cases TEXT DEFAULT '[]',      -- JSON array
  getting_started TEXT DEFAULT '',

  -- Relationships
  related_tools TEXT DEFAULT '[]',  -- JSON array of tool IDs
  alternatives TEXT DEFAULT '[]',   -- JSON array of tool IDs
  integrations TEXT DEFAULT '[]',   -- JSON array of tool IDs

  -- Metadata
  source TEXT NOT NULL CHECK(source IN ('github','producthunt','awesome-list','manual')),
  pricing TEXT NOT NULL DEFAULT 'open-source' CHECK(pricing IN ('free','freemium','paid','open-source')),
  affiliate_url TEXT,
  content_status TEXT DEFAULT 'pending' CHECK(content_status IN ('pending','partial','complete')),
  intelligence TEXT DEFAULT '',          -- JSON: deep analysis of capabilities, integrations, limitations

  -- Ranking
  score REAL DEFAULT 0,
  percentile_rank REAL,

  -- Timestamps
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  data_refreshed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Metric snapshots for historical tracking (star velocity calculation)
CREATE TABLE IF NOT EXISTS metric_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tool_id TEXT NOT NULL REFERENCES tools(id),
  date TEXT NOT NULL,               -- YYYY-MM-DD
  github_stars INTEGER,
  commit_count_90d INTEGER,
  release_count_6m INTEGER,
  npm_downloads_weekly INTEGER,
  UNIQUE(tool_id, date)
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT '',
  tool_count INTEGER DEFAULT 0
);

-- Stack Graph: task/scenario-based tool combinations
CREATE TABLE IF NOT EXISTS stacks (
  slug TEXT PRIMARY KEY,             -- "rag-chatbot"
  title TEXT NOT NULL,               -- "Build a RAG Chatbot"
  description TEXT DEFAULT '',       -- Overview of the scenario
  icon TEXT DEFAULT '',              -- Emoji icon
  difficulty TEXT DEFAULT 'intermediate' CHECK(difficulty IN ('beginner','intermediate','advanced')),
  layers TEXT DEFAULT '[]',          -- JSON: [{name, description, tools: [{tool_id, role, note}]}]
  tags TEXT DEFAULT '[]',            -- JSON array of tag strings
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Newsletter subscribers
CREATE TABLE IF NOT EXISTS subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TEXT NOT NULL DEFAULT (datetime('now')),
  confirmed INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tools_score ON tools(score DESC);
CREATE INDEX IF NOT EXISTS idx_tools_created ON tools(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tools_source ON tools(source);
CREATE INDEX IF NOT EXISTS idx_snapshots_tool_date ON metric_snapshots(tool_id, date);
