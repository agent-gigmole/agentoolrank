import { badgeHtml } from "./submissions";

// "Your page is live" email to the person who submitted the tool (the /submit form promises it). Transactional, sent
// once per approved submission to the address they gave us; it carries the badge and the featured-slot link.
export function liveEmail(o: { name: string; slug: string; baseUrl: string; kitType?: string }): { subject: string; text: string } {
  const page = `${o.baseUrl}/tool/${o.slug}`;
  const tracked = `${page}?ref=live-notify`; // landing sessions from this email show up as src=live-notify
  return {
    subject: `${o.name} is live on AgentoolRank`,
    text: [
      "Hi,",
      "",
      `${o.name} passed review and its page is live: ${tracked}`,
      "",
      "It shows live GitHub stars, growth and release activity, refreshed daily, and it is in our llms.txt and MCP server, so AI assistants can find it.",
      "",
      "Add the badge to your README or website (it links back to the page):",
      badgeHtml(o.baseUrl, o.slug, o.name),
      "",
      `Want more developers to see it? Feature it for 7 days at the top of the homepage and its category page ($49, one-time): ${tracked}#maintainers`,
      "",
      `Listing it on other directories too? We tested 101 launch directories with our own products; the Submit Kit says which fit this tool and which to skip (top 10 free): ${o.baseUrl}/submit-kit?${o.kitType ? `type=${o.kitType}&` : ""}ref=live-notify`,
      "",
      "Thanks for submitting,",
      "Jason T., AgentoolRank",
      "",
      "You get this once because you submitted this tool. Reply if anything on the page is wrong.",
    ].join("\n"),
  };
}
