// Daily: per-tag Brevo health for the shared account (our "outreach" + new_ladar's "newsiteradar").
// Prints one line per tag; "ALERT" when anything bounced, was blocked or reported as spam (then pause that sender's key).
import { readFileSync } from "node:fs";

const key = readFileSync(`${process.env.HOME}/.config/secrets/brevo-api-key`, "utf8").trim();
for (const tag of ["outreach", "newsiteradar"]) {
  const res = await fetch(`https://api.brevo.com/v3/smtp/statistics/aggregatedReport?days=7&tag=${tag}`, { headers: { "api-key": key } });
  const r = (await res.json()) as Record<string, number>;
  const bad = (r.hardBounces ?? 0) + (r.softBounces ?? 0) + (r.blocked ?? 0) + (r.spamReports ?? 0) + (r.invalid ?? 0);
  console.log(`${new Date().toISOString()} ${bad ? "ALERT" : "ok"} tag=${tag} 7d requests=${r.requests ?? 0} delivered=${r.delivered ?? 0} hardBounces=${r.hardBounces ?? 0} softBounces=${r.softBounces ?? 0} blocked=${r.blocked ?? 0} spam=${r.spamReports ?? 0} unsub=${r.unsubscribed ?? 0}`);
}
