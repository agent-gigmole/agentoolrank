// Shared submission logic for the /submit form, the JSON API and the MCP server.
import { db } from "@repo/db";
import { randomBytes } from "node:crypto";
import { validateSubmission, slugFromSubmission, estimatedWaitDays, badgeHtml, type SubmissionInput } from "./submissions";
import { buildOffers, recommendPlan, messageForHuman, type Offer } from "./offers";

// Additive only: created on first use, never altered here.
const CREATE_SUBMISSIONS = `CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  tagline TEXT NOT NULL,
  github_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  plan TEXT NOT NULL DEFAULT 'free' CHECK(plan IN ('free','fast','featured')),
  backlink_verified INTEGER NOT NULL DEFAULT 0,
  src TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at TEXT
)`;
const CREATE_TOKENS = `CREATE TABLE IF NOT EXISTS submission_tokens (
  submission_id INTEGER PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

let ready = false;
async function ensureTables() {
  if (ready) return;
  await db.execute(CREATE_SUBMISSIONS);
  await db.execute(CREATE_TOKENS);
  ready = true;
}

const BASE_URL = () => process.env.NEXT_PUBLIC_BASE_URL || "https://agentoolrank.com";
const paymentsEnabled = () => Boolean(process.env.STRIPE_SECRET_KEY);

async function tokenFor(id: number): Promise<string> {
  const r = await db.execute({ sql: "SELECT token FROM submission_tokens WHERE submission_id = ?", args: [id] });
  if (r.rows.length > 0) return String(r.rows[0].token);
  const token = randomBytes(16).toString("hex");
  await db.execute({ sql: "INSERT OR IGNORE INTO submission_tokens (submission_id, token) VALUES (?, ?)", args: [id, token] });
  return token;
}

async function queuePosition(id: number): Promise<number> {
  const r = await db.execute({ sql: "SELECT COUNT(*) AS n FROM submissions WHERE status = 'pending' AND id <= ?", args: [id] });
  return Number(r.rows[0].n);
}

export type SubmitResult =
  | { kind: "invalid"; errors: string[] }
  | { kind: "spam" }
  | { kind: "listed"; slug: string; url: string }
  | {
      kind: "queued";
      submission_id: number;
      status_token: string;
      slug: string;
      queue_position: number;
      eta_days: number;
      offers: Offer[];
      recommended_plan: Offer | null;
      message_for_human: string;
      badge_html: string;
      status_url: string;
    };

export async function createSubmission(
  input: SubmissionInput,
  opts: { src?: string; maxBudgetUsd?: number; deadlineDays?: number; wantFeatured?: boolean } = {},
): Promise<SubmitResult> {
  const v = validateSubmission(input);
  if (!v.ok) return v.spam ? { kind: "spam" } : { kind: "invalid", errors: v.errors };
  const s = v.value;
  const slug = slugFromSubmission(s);
  await ensureTables();

  const listed = await db.execute({ sql: "SELECT id FROM tools WHERE id = ?", args: [slug] });
  if (listed.rows.length > 0) return { kind: "listed", slug, url: `${BASE_URL()}/tool/${slug}` };
  if ((await db.execute({ sql: "SELECT 1 FROM tools_archive WHERE id = ?", args: [slug] }).catch(() => ({ rows: [] }))).rows.length > 0) return { kind: "invalid", errors: ["This tool is outside what AgentoolRank lists."] };

  const existing = await db.execute({ sql: "SELECT id FROM submissions WHERE url = ?", args: [s.url] });
  const id = existing.rows.length > 0
    ? Number(existing.rows[0].id)
    : Number((await db.execute({
        sql: "INSERT INTO submissions (slug, url, name, email, tagline, github_url, src) VALUES (?, ?, ?, ?, ?, ?, ?)",
        args: [slug, s.url, s.name, s.email, s.tagline, s.github_url, (opts.src ?? "").slice(0, 200)],
      })).lastInsertRowid);

  const token = await tokenFor(id);
  const position = await queuePosition(id);
  const eta = estimatedWaitDays(position);
  const offers = buildOffers({ baseUrl: BASE_URL(), submissionId: id, token, waitDays: eta, paymentsEnabled: paymentsEnabled() });
  return {
    kind: "queued",
    submission_id: id,
    status_token: token,
    slug,
    queue_position: position,
    eta_days: eta,
    offers,
    recommended_plan: recommendPlan(offers, { maxBudgetUsd: opts.maxBudgetUsd, deadlineDays: opts.deadlineDays, wantFeatured: opts.wantFeatured }),
    message_for_human: messageForHuman(s.name, offers),
    badge_html: badgeHtml(BASE_URL(), slug, s.name),
    status_url: `${BASE_URL()}/api/v1/submissions/${id}?token=${token}`,
  };
}

export async function checkToken(id: number, token: string): Promise<boolean> {
  await ensureTables();
  const r = await db.execute({ sql: "SELECT 1 FROM submission_tokens WHERE submission_id = ? AND token = ?", args: [id, token] });
  return r.rows.length > 0;
}

export async function submissionStatus(id: number, token: string) {
  if (!(await checkToken(id, token))) return null;
  const r = await db.execute({ sql: "SELECT id, slug, status, plan, note, created_at, reviewed_at FROM submissions WHERE id = ?", args: [id] });
  const row = r.rows[0] as unknown as { id: number; slug: string; status: string; plan: string; note: string; created_at: string; reviewed_at: string | null } | undefined;
  if (!row) return null;
  const pending = row.status === "pending";
  return {
    submission_id: Number(row.id),
    slug: row.slug,
    status: row.status,
    plan: row.plan,
    queue_position: pending ? await queuePosition(Number(row.id)) : null,
    reviewed_at: row.reviewed_at,
    reason: row.status === "rejected" ? row.note.replace(/\s*paid:\S+/g, "") : null,
    listing_url: row.status === "approved" ? `${BASE_URL()}/tool/${row.slug}` : null,
  };
}
