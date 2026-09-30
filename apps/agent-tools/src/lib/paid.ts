// Server-side helpers for paid plans: Stripe calls (REST, no SDK) and recording upgrades.
import { db } from "@repo/db";
import { PLANS, isPlan, type Plan } from "./plans";
import { activeFeatured, type FeaturedRow } from "./featured";

// Additive only: created on first use. payments is the source of truth for paid plans
// (submissions.plan predates the $9 "priority" tier and its CHECK can't hold it).
const CREATE_PAYMENTS = `CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id INTEGER NOT NULL,
  plan TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  stripe_session TEXT NOT NULL UNIQUE,
  src TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;
const CREATE_FEATURED = `CREATE TABLE IF NOT EXISTS featured (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL,
  starts_at TEXT NOT NULL DEFAULT (datetime('now')),
  ends_at TEXT NOT NULL,
  stripe_session TEXT NOT NULL UNIQUE
)`;

export async function stripe(path: string, init?: { method?: string; body?: URLSearchParams }) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: init?.method ?? "GET",
    headers: { Authorization: `Bearer ${key}`, ...(init?.body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) },
    body: init?.body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Stripe ${res.status}: ${data?.error?.message ?? "error"}`);
  return data;
}

export interface Confirmation {
  paid: boolean;
  plan?: Plan;
  slug?: string;
}

/** Verify a Checkout Session with Stripe and record the upgrade once (idempotent on session id). */
export async function confirmSession(sessionId: string): Promise<Confirmation> {
  if (!/^cs_(live|test)_[A-Za-z0-9]+$/.test(sessionId)) return { paid: false };
  const s = await stripe(`checkout/sessions/${sessionId}`);
  const plan = s.metadata?.plan;
  if (s.payment_status !== "paid" || s.metadata?.site !== "agentoolrank" || !isPlan(plan)) return { paid: false };

  const submissionId = Number(s.metadata.submission_id);
  const slug = String(s.metadata.slug ?? "");
  await db.execute(CREATE_PAYMENTS);
  await db.execute({
    sql: "INSERT OR IGNORE INTO payments (submission_id, plan, amount_cents, stripe_session, src) VALUES (?, ?, ?, ?, ?)",
    args: [submissionId, plan, Number(s.amount_total ?? PLANS[plan].amount), sessionId, String(s.metadata.src ?? "")],
  });
  if (plan !== "priority") {
    await db.execute({ sql: "UPDATE submissions SET plan = ? WHERE id = ?", args: [plan, submissionId] });
  }
  if (PLANS[plan].featuredDays > 0) {
    await db.execute(CREATE_FEATURED);
    await db.execute({
      sql: `INSERT OR IGNORE INTO featured (slug, ends_at, stripe_session) VALUES (?, datetime('now', '+${PLANS[plan].featuredDays} days'), ?)`,
      args: [slug, sessionId],
    });
  }
  return { paid: true, plan, slug };
}

/** Slugs currently featured (ignores the table not existing yet). */
export async function featuredSlugs(): Promise<string[]> {
  try {
    const r = await db.execute("SELECT slug, starts_at, ends_at FROM featured WHERE ends_at > datetime('now')");
    return activeFeatured(r.rows as unknown as FeaturedRow[], new Date());
  } catch {
    return [];
  }
}
