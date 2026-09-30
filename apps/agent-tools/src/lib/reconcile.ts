// Payment reconciliation: a buyer may close the tab before reaching /submit/thanks, so we also
// scan recent Checkout Sessions (read-only key) and record any paid ones we missed.
import { isPlan } from "./plans";

export interface StripeSessionLike {
  id: string;
  payment_status: string;
  metadata?: Record<string, string> | null;
}

export function paidAgentoolrankSessions<T extends StripeSessionLike>(sessions: T[]): T[] {
  return sessions.filter((s) => s.payment_status === "paid" && s.metadata?.site === "agentoolrank" && isPlan(s.metadata?.plan));
}
