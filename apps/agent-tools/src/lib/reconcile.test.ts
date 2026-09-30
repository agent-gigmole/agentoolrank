import { describe, it, expect } from "vitest";
import { paidAgentoolrankSessions } from "./reconcile";

describe("paidAgentoolrankSessions", () => {
  const s = (id: string, site: string, status: string, plan = "fast") => ({ id, payment_status: status, metadata: { site, plan } });
  it("keeps only paid sessions for this site with a valid plan", () => {
    const out = paidAgentoolrankSessions([
      s("cs_live_a", "agentoolrank", "paid"),
      s("cs_live_b", "pixtidy", "paid"),
      s("cs_live_c", "agentoolrank", "unpaid"),
      s("cs_live_d", "agentoolrank", "paid", "gold"),
      s("cs_live_e", "agentoolrank", "no_payment_required"),
    ]);
    expect(out.map((x) => x.id)).toEqual(["cs_live_a"]);
  });
});
