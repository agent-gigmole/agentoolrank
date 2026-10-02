# We submitted to 101 directories: 81 had a free option, few without strings

These findings come from our own submission notes for three products, collected by hand and with browser automation from 2026-09-29 through 2026-10-02, and last verified on 2026-10-02. The sample covers 101 directory sites where at least one product entered the submission flow, with one submission per site per product and no captcha-solving services.

I'm Jason T., maker of [AgentoolRank](https://agentoolrank.com), a directory of open-source AI agent tools ranked by live GitHub activity. We also run the two other small products included in this submission run.

The useful distinction is between finding a free form and getting the result you came for. Our notes track what happened during submission.

## What happened across 101 directories

Here is where the sites stood in our log:

| Outcome | Sites |
|---|---:|
| Submitted or already listed | 66 |
| Opened, then skipped because of rules or fit | 19 |
| Did not go through on the first try, queued for retry | 9 |
| Stopped at a visible captcha | 5 |
| Stopped because the free tier required a badge we chose not to place | 2 |

Some entries were already there; others had only reached the submitted state.

The 19 skipped sites also matter when planning a launch. Opening a directory and reading its rules can end with a reasonable decision not to submit.

The 9 sites that did not go through on the first try are queued for a retry. Keep a log per site with the date, result and what blocked you so you can follow up without submitting twice.

## Free options still come with conditions

Across all 101 sites, we recorded these conditions:

| Condition | Sites |
|---|---:|
| Free submissions enter a review queue | 56 |
| Displaying the directory's badge is required | 14 |
| A backlink to the directory is required | 12 |
| An X post is required | 1 |

The queue is worth checking before you fill out the form. Viesearch showed 1,200+ queued submissions and said its free tier rejects 82%.

SaaSHub's free no-login form can take up to 32 days. TinyLaunch scheduled a free launch for 2026-11-02.

Badge requirements can also outlast the submission session. Findly.tools can delist you if its footer badge is removed later. If you accept that condition, it becomes something to remember when changing your site, rather than a box to tick once.

We also saw prices on 39 sites. The median entry price among those sites was $12.

My advice is to read the free-tier conditions first. If you will not place a badge or reciprocal backlink, finding that out before entering your product details saves work.

## Link attributes recorded on 30 sites

We recorded link `rel` attributes on only 30 sites, usually when something looked off. This was not a random sample.

Within that checked group, we recorded:

| Recorded link type | Sites |
|---|---:|
| Nofollow | 23 |
| Dofollow | 6 |
| UGC | 1 |

The specific examples are more useful than extrapolating from that table. AlternativeTo listings are nofollow. LaunchBoosts free-plan links are nofollow. make.rs profile links use `rel="ugc nofollow"`.

AI Agents Directory's free links are nofollow, and dofollow starts at $49. That is a concrete case where "free listing available" and "free dofollow link available" are different claims.

For a maker submitting primarily for backlinks, the practical check happens on the live listing. Inspect the link and its `rel` attribute before counting it as a dofollow backlink.

## Budget for human steps and uncertain confirmations

Browser automation still ran into steps that needed a person. In our notes, 30 sites required someone to open an inbox for a verification link, magic link or code. Another recorded characteristic was Google login, offered or required on 19 sites.

We also recorded 8 sites with a captcha a person had to complete. That is a different measure from the 5 captcha-blocked outcomes in the first table. One describes a requirement encountered in the flow; the other describes where our attempt stopped. We did not use captcha-solving services.

I would budget for a fully unattended agent to stall on about a third of sites. Inbox access alone appeared on 30 of the 101.

Some interruptions were small enough to miss but specific enough to log:

- **FutureTools:** Dismiss the newsletter popup with "No thanks" before the form works.
- **SaaSHub:** Claim the listing before closing the browser, or you lose management access.
- **Viesearch:** Check spam for the confirmation email, then click "Join the Waiting List" and "Wait in Line."
- **Findly.tools:** Remember that removing the footer badge later can lead to delisting.

Knowing those details changes how I would supervise an automated run. I would keep inbox access available and review uncertain endings, rather than assuming the browser can finish everything unattended.

Confirmation was its own problem. We recorded a clear success signal on 75 of the 101 sites, such as FutureTools' "Tool Submitted!" For the other 26 we have no reliable signal in our notes, so those needed a later check.

## How to plan your own submission run

Start by deciding which conditions you are willing to accept. Read the free-tier rules before filling in the form, especially badge and backlink requirements. Treat a review queue as pending work, with a follow-up date where the directory gives you a useful waiting period.

Reserve time for inbox steps and captchas. Have a way to pause for a person instead of losing track of the site.

Keep a dated log per site and product. Record the result and what blocked you. Keep "submitted," "already listed" and "needs checking" distinct, so you can follow up without submitting twice. When a listing is live, check the link separately.

I would also keep traffic expectations low. We have seen very little referral traffic so far. For planning purposes, treat links and discoverability as the possible value, rather than expecting directory submissions to deliver traffic.

The next useful step is choosing which conditions fit your launch, before opening more forms. Our [free comparison of where to list an AI agent tool](https://agentoolrank.com/where-to-list) can help with that decision.

If a site's rules changed, tell us and we update the data.

Jason T.

Disclosure: The linked comparison is ours.
