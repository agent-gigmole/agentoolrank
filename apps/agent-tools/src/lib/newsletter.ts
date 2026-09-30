// Weekly email digest (sent via Brevo once the sending account is verified).
interface Data {
  weekLabel: string;
  gainers: Array<{ id: string; name: string; gain: number; tagline: string }>;
  newTools: Array<{ id: string; name: string; tagline: string }>;
  quiet: Array<{ id: string; name: string; stars: number; lastCommit: string }>;
  baseUrl: string;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const n = (x: number) => Math.round(x).toLocaleString("en-US");

export function newsletterSubject(d: Data): string {
  const top = d.gainers[0];
  return `AI agent tools this week: ${top ? `${top.name} +${n(top.gain)} stars` : "the latest"}${d.newTools.length ? `, ${d.newTools.length} new tool${d.newTools.length === 1 ? "" : "s"}` : ""}`;
}

export function newsletterHtml(d: Data, unsubscribeUrl: string): string {
  const link = (path: string, text: string) => `<a href="${d.baseUrl}${path}?ref=newsletter">${esc(text)}</a>`;
  const li = (items: string[]) => `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
  return [
    `<p>Here's what moved in open-source AI agent tools (week of ${esc(d.weekLabel)}).</p>`,
    `<h3>Fastest growing</h3>`,
    li(d.gainers.map((g) => `${link(`/tool/${g.id}`, g.name)} +${n(g.gain)} stars — ${esc(g.tagline)}`)),
    d.newTools.length ? `<h3>New on AgentoolRank</h3>${li(d.newTools.map((t) => `${link(`/tool/${t.id}`, t.name)} — ${esc(t.tagline)}`))}` : "",
    d.quiet.length ? `<h3>Gone quiet (consider alternatives)</h3>${li(d.quiet.map((q) => `${link(`/alternatives/${q.id}`, q.name)} — ${n(q.stars)} stars, last commit ${esc(q.lastCommit)}`))}` : "",
    `<p>Full data: ${link("/report", "State of open-source AI agent tools")} · Building one? ${link("/submit", "List it free")}</p>`,
    `<p style="color:#888;font-size:12px">You subscribed at agentoolrank.com. <a href="${esc(unsubscribeUrl)}">Unsubscribe</a>.</p>`,
  ].join("\n");
}
