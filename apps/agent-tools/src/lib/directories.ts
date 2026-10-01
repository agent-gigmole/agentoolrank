// Where to list an AI agent tool — facts checked by hand on 2026-10-01 on each site's submit page.
// Keep every row verifiable (source URL + check date). Update the date when re-checking.
export const CHECKED = "2026-10-01";

export interface DirectoryRow {
  name: string;
  url: string; // submit page we checked
  free: string;
  paid: string;
  review: string;
  notes: string;
  self?: boolean;
}

export const DIRECTORIES: DirectoryRow[] = [
  {
    name: "AgentoolRank (us)",
    url: "https://agentoolrank.com/submit",
    free: "Yes — queued review",
    paid: "$9 (≤3 days) · $19 (≤1 day) · $49 (1 day + 7 days featured)",
    review: "Free: queue order; badge on your site moves you up",
    notes: "Agent-tools only. Live GitHub stats, alternatives & comparison pages, MCP server. New site: traffic is still small.",
    self: true,
  },
  {
    name: "PeerPush",
    url: "https://peerpush.com/submit",
    free: "Yes — free queue (we were quoted ~70 days)",
    paid: "$39 launch · $89 + 7-day promo · $229 + 30-day promo",
    review: "Paid: instant",
    notes: "General product directory with a large builder community, points for reviewing others, daily/weekly awards.",
  },
  {
    name: "AI Agents List",
    url: "https://aiagentslist.com/submit",
    free: "Free eligibility check only",
    paid: "$29 lifetime listing · $49 launch boost (dofollow)",
    review: "48h ($29) · 24h ($49)",
    notes: "AI tools directory; account required.",
  },
  {
    name: "mcp.so",
    url: "https://mcp.so/submit",
    free: "Not on the web form (a GitHub issue route exists)",
    paid: "$39 one-time (instant, verified badge, dofollow)",
    review: "Paid: instant",
    notes: "MCP servers only.",
  },
  {
    name: "mcpservers.org",
    url: "https://mcpservers.org/submit",
    free: "Yes",
    paid: "$39 (review ≤24h, badge, dofollow)",
    review: "Free: up to 2 weeks",
    notes: "MCP servers only; accepts remote servers and official MCP Registry names.",
  },
  {
    name: "Official MCP Registry",
    url: "https://registry.modelcontextprotocol.io",
    free: "Yes (publish via mcp-publisher CLI)",
    paid: "—",
    review: "Immediate after domain/GitHub verification",
    notes: "Canonical MCP registry other directories read from; MCP servers only.",
  },
];
