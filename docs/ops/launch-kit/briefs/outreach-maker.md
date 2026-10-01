# Brief: maker outreach email (T17) — template with placeholders

## Product (one line)
AgentoolRank (agentoolrank.com) ranks 669 open-source AI agent tools by live GitHub activity: stars, 30-day star growth, commits in the last 90 days, releases. Data refreshes daily. Each tool has its own page with stats, alternatives and side-by-side comparisons. The sender built it.

## Recipient
A maintainer of an open-source AI agent tool that is already listed. We found their contact email published on their own project website or README. They did not ask to hear from us. Busy developer; gets lots of cold email.

## Goal of this email
They open their tool's page; optionally add a README badge (links back to their page); optionally reply with corrections. No sales pitch, no mention of paid plans.

## Placeholders (must appear exactly like this, the code fills them in)
{owner} {name} {rank} {total} {category} {page_url} {badge_markdown}

## Facts allowed
- {name} is currently #{rank} of {total} in {category} on AgentoolRank, ranked by live GitHub activity
- The page {page_url} shows its stats, alternatives and side-by-side comparisons
- The README badge {badge_markdown} shows the live star count and links to that page
- If anything about {name} is wrong or outdated, a reply gets it fixed
- Signed: Ethan Tan, AgentoolRank, https://agentoolrank.com
- Opt-out line required: if they reply "no", we never email again

## Rules
- Plain text, under 120 words, no bullet lists, no exclamation marks, no flattery ("love your project", "amazing").
- Subject line: plain, factual, includes {name}; no clickbait; under 70 characters.
- Do not invent numbers, features, user counts or traffic figures. Do not claim traffic we do not have.
- Output: first line "Subject: ...", blank line, then the body.
