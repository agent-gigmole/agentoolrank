# What submitting to 101 directories taught us about free listings

**81 of 101 directories offered a free option.** Budget time for inbox steps and captchas, and read the free tier's conditions before filling the form.

Our own submission notes cover 101 sites across three products, tested September 29 through October 2, 2026, and last verified October 2.

I'm Jason T., maker of AgentoolRank, our directory of open-source AI agent tools ranked by live GitHub activity. We also run two other small products.

## What the free option actually bought us

We worked by hand and with browser automation, with one submission per site per product and no captcha-solving services. At least one of our products went through each site's submission flow.

The headline needs three qualifications:

- **56 sites put free submissions in a review queue.**
- **30 sites required an inbox step.** Verification links, magic links, and codes needed someone available.
- **66 sites ended as submitted or already listed.**

Here is the full outcome breakdown:

| Outcome | Sites |
|---|---:|
| Submitted or already listed | 66 |
| Opened, then skipped for rules or fit | 19 |
| Failed on the first try, queued for retry | 9 |
| Stopped at a visible captcha | 5 |
| Stopped because the free tier required a badge we declined | 2 |

Keep "skipped" in your log.

## Budget for handling, then budget for waiting

Separate your working time from the directory's waiting time.

For hands-on work, reserve attention for inbox checks and account access. Besides the 30 sites requiring email interaction, 19 offered or required Google login, and 8 had a captcha a person had to complete. These categories can overlap. The 8 captcha sites describe flow requirements; the 5 captcha-stopped outcomes describe where our attempts ended.

Inbox steps alone mean a fully unattended agent will stall on about a third of these sites.

For elapsed waiting time, the examples were concrete:

| Directory | Observed free submission wait or condition |
|---|---|
| SaaSHub | Free no-login form can take up to 32 days |
| TinyLaunch | Scheduled our free launch for November 2, 2026 |
| Viesearch | Showed 1,200+ queued submissions and stated an 82% free-tier rejection rate |

Also reserve a follow-up pass. Only **75 sites showed a clear confirmation**, such as FutureTools' "Tool Submitted!" For the others, the last click was not enough to establish what happened. Check later before submitting again.

## A shortlist ordered by conditions you can accept

We read each free tier's conditions before filling the form. Here is what those conditions looked like.

For sites that fit, this is the order I would use to triage the observed options.

| Priority | Candidate | When to consider it | Friction to account for |
|---|---|---|---|
| Start here | FutureTools | Its rules fit your tool and you want a clear submission signal | Dismiss the newsletter popup with "No thanks" before using the form; look for "Tool Submitted!" |
| Start here if waiting is acceptable | SaaSHub | Its rules fit and the free no-login route suits you | Up to 32 days; claim the listing before closing the browser or lose management access |
| Schedule separately | TinyLaunch | The offered launch date works for your plans | Our free launch was scheduled for November 2, 2026 |
| Conditional for AI agent tools | AI Agents Directory | Its eligibility rules fit and a free `nofollow` link is acceptable | Free links are `nofollow`; dofollow starts at $49 |
| Defer if queue risk matters | Viesearch | You accept its stated queue and rejection conditions | Check spam, then click "Join the Waiting List" and "Wait in Line" |
| Ongoing badge condition | Findly.tools | Free listing tied to a footer badge | Our notes say removing the badge later can lead to delisting |

This order changes with your constraints.

Across the dataset, **14 sites required a badge, 12 required a backlink, and 1 required an X post**.

Of the 39 sites that showed a price, the median entry price was $12.

## Copy this submission log before opening forms

Use a separate row for each site and product. Keep a log of the date, result, and what blocked you so you can avoid duplicate submissions and follow up.

```text
Site:
Product:
Submission date:

Fit decision:
Free-tier conditions:
Badge or reciprocal-link commitment:

Attempt result:
Confirmation text or evidence:
Blocker:
Inbox or account action still needed:

Expected review or launch date:
Next follow-up action:
Follow-up date:

Live listing URL:
Observed link rel:
Management access claimed:
Continuing requirements:
```

Use the same outcome labels consistently: submitted or already listed, skipped, retry queued, captcha-stopped, or badge-declined. Add a note when confirmation is uncertain.

Make follow-up instructions specific enough to act on:

- **SaaSHub:** Claim management access before ending the browser session. Record the review wait separately.
- **Viesearch:** Check spam and complete both waiting-list actions.
- **Findly.tools:** The site can delist you if you remove the footer badge later.
- **Unclear confirmation:** Check for the listing later before retrying.

For a failed first attempt, write down the blocker. Otherwise, the next session starts by rediscovering the same problem.

## Verify the link before counting it

We inspected link `rel` attributes on **30 sites**, usually when something looked off. This was not a random sample.

| Recorded link category | Sites |
|---|---:|
| `nofollow` | 23 |
| Dofollow | 6 |
| `ugc` | 1 |

AlternativeTo listings were `nofollow`, as were LaunchBoosts free-plan links. make.rs profile links used `rel="ugc nofollow"`.

We only count a dofollow link after inspecting the live listing.

## Stars measure attention, downloads measure use

For open-source tools, keep distribution signals separate from evidence of use, too. Stars measure attention; package downloads offer a usage signal, not a user count.

The [downloads comparison](https://agentoolrank.com/downloads) counts npm and PyPI downloads over 30 days using the npm downloads API and pypistats. A package counts only when its registry page links back to the tool's own repository. Downloads include CI and mirrors.

## Spend the next session on fit and follow-up

We saw very little referral traffic so far. We make no promise of traffic, publication or ranking gains.

Check conditions before filling forms, reserve time for inbox and captcha steps, and keep a dated log of each site's result and blocker.

Use our [free comparison of where to list an AI agent tool](https://agentoolrank.com/where-to-list) to choose where to spend that submission time.

If a site's rules changed, tell us and we update the data.

Our [Submit Kit](https://agentoolrank.com/submit-kit) ranks these directories for your product type, with form gotchas and a don't-submit list; the top 10 are free over MCP, and the full list is $29 one-time.

Jason T.

Disclosure: Submit Kit is our product.
