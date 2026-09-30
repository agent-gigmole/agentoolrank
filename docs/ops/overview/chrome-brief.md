# Task brief for Claude in Chrome — AgentoolRank setup

You are helping the owner set up accounts for **AgentoolRank** (https://agentoolrank.com), a directory of AI agent tools. It is owned by **TENSO LLC** (Colorado, USA). The owner is logged in to the services below. Do the parts in order (A → D). After each step, report what you changed (before → after).

If a page asks for a password, 2FA, phone/SMS verification, CAPTCHA, identity documents, or anything this brief does not list: **STOP and hand control to the owner**. The owner handles those, then you continue.

## Hard rules — do NOT
- Never read out, type into chat, or paste any secret yourself (tokens, API keys, passwords, card numbers). When a secret is shown **once**, stop and hand over to the owner ("🔑 OWNER" steps below). The owner copies it and saves it in their terminal.
- Do not create Stripe standard secret keys (`sk_live_…`). Do not roll or delete existing keys.
- Do not change the legal name, EIN, address, bank account, or owner details on any account.
- Do not buy anything, upgrade any plan, or enter card details.
- Do not delete repositories, workflows, DNS records, or existing email routes.
- Do not change anything about **pixtidy** or **social.medns.org** except where step B3 says so.

---

## Part A — GitHub (repo `agent-gigmole/agentoolrank`)

Why: the owner's local GitHub token expired. Claude Code can't push code, and the daily data job has been stopped since June.

### A1. Re-enable the daily workflow
1. Open https://github.com/agent-gigmole/agentoolrank/actions/workflows/daily-update.yml
2. If there is a banner "This scheduled workflow is disabled…", click **Enable workflow**.
3. Report: enabled yes/no.

### A2. Create a fine-grained personal access token
1. Open https://github.com/settings/personal-access-tokens/new
2. Fill in:
   - **Token name:** `claude-code-agentoolrank`
   - **Expiration:** 90 days
   - **Resource owner:** `agent-gigmole` (if it's an organization and needs approval, report it)
   - **Repository access:** Only select repositories → `agent-gigmole/agentoolrank`
   - **Repository permissions:**
     - Contents: **Read and write**
     - Actions: **Read and write**
     - Workflows: **Read and write**
     - Metadata: Read-only (automatic)
   - Leave all other permissions as "No access".
3. Click **Generate token**.
4. 🔑 **OWNER:** the token (`github_pat_…`) is shown once. Stop here and tell the owner:
   "Copy the token, then run in a normal WSL terminal (not inside Claude Code): `save-secret github-agentoolrank` and paste it."

---

## Part B — Stripe (TENSO LLC account, https://dashboard.stripe.com, LIVE mode)

Why: AgentoolRank will sell paid listings ($19 fast-track listing, $49 featured for 7 days). They use the same Stripe account as pixtidy, with the card-statement suffix `AGENTOOLRANK`.

### B1. Restricted key for checkout
1. Open https://dashboard.stripe.com/apikeys → **Create restricted key**. If Stripe asks "how will you use this key", choose "Building your own integration".
2. **Key name:** `agentoolrank-checkout`
3. Permissions: set **Checkout Sessions → Write**. Everything else: **None**.
4. Click **Create key**.
5. 🔑 **OWNER:** the key (`rk_live_…`) is shown once. Stop and tell the owner:
   "Copy the key, then run in a normal WSL terminal (not inside Claude Code): `stripe-save-key agentoolrank-checkout` and paste it."

### B2. Read-only key for reporting
1. Create another restricted key. **Key name:** `agentoolrank-ops`
2. Permissions: set every resource to **Read** (use the "Read" column header if there is one). No Write anywhere.
3. Create key.
4. 🔑 **OWNER:** "Copy the key, then run in a normal WSL terminal: `stripe-save-key agentoolrank-ops` and paste it."

### B3. Business description — add AgentoolRank
1. Settings → Business → Business details → Edit **Product description**.
2. Keep the existing text and add one line at the end:
   > (3) AgentoolRank (agentoolrank.com), a directory of AI agent tools where software makers pay a one-time fee for faster listing review or a featured placement.
3. Save. If Stripe asks for review or documents, STOP and report.

---

## Part C — Cloudflare (the account that holds `agentoolrank.com`)

Note: agentoolrank.com is **not** in the account named "0xzap0x@gmail.com's Account" (ID `ba9838a0…`, which holds pixtidy.com). It's in the account "Tensam.th@gmail.com's Account".

### C1. Open the right account
1. Open https://dash.cloudflare.com and switch to the account **"Tensam.th@gmail.com's Account"** (Account ID `db304ebc5bd6e6c38cee8c8275982830`). It holds agentoolrank.com (registered at Cloudflare, auto-renew on, expires 2027-03-27). If the owner's current login can't see it, STOP and ask the owner to log in as tensam.th@gmail.com.
2. Report that you're in the right account.

### C2. Brand email: hello@agentoolrank.com
1. agentoolrank.com → **Email** → **Email Routing** → Get started / Enable. Accept the MX/TXT records Cloudflare proposes (it adds them itself).
2. **Destination address:** `0xzap0x@gmail.com`. Cloudflare sends a verification email: open Gmail (the owner is logged in), click the verify link, and return.
3. **Custom address:** `hello` → action "Send to an email" → `0xzap0x@gmail.com`. Save.
4. Report: routing enabled, destination verified, hello@ rule active.

### C3. API token limited to this domain
1. My Profile → **API Tokens** → Create Token → **Create Custom Token**.
2. **Token name:** `claude-agentoolrank`
3. Permissions:
   - Zone → **DNS** → Edit
   - Zone → **Email Routing Rules** → Edit
   - Zone → **Zone** → Read
4. **Zone Resources:** Include → Specific zone → `agentoolrank.com`
5. TTL: end date 90 days from today.
6. Continue → Create Token.
7. 🔑 **OWNER:** "Copy the token, then run in a normal WSL terminal: `cf-save-token agentoolrank` and paste it."

---

## Part D — Brand accounts (do only after C2 works)

Use **hello@agentoolrank.com** as the sign-up email for every account. Verification emails arrive in the owner's Gmail. Use the same public profile on every account:

- **Name:** AgentoolRank
- **Handle (try in order):** `agentoolrank`, `agentool_rank`, `agentoolrankhq`
- **Bio:** `Ranking 460+ open-source AI agent tools by real GitHub activity — stars, commits, releases. Compare tools side by side.`
- **Website:** https://agentoolrank.com
- **Avatar:** download https://agentoolrank.com/icon (or skip if the site won't accept it)

Accounts (create in this order; skip one if blocked and report why):
1. **X / Twitter** — https://x.com/i/flow/signup
2. **Product Hunt** — https://www.producthunt.com (sign up with email). Do NOT schedule a launch.
3. **Peerlist** — https://peerlist.io
4. **PeerPush** — https://peerpush.com → submit **agentoolrank.com** on the **Free** plan only. If a paid option, discount, or "skip the queue" popup appears, decline it.

For every account:
- Password: 🔑 **OWNER** types the password (use their password manager). You don't choose it or see it.
- Phone / SMS / CAPTCHA: 🔑 **OWNER**.
- After it's created: tell the owner "run in a normal WSL terminal: `save-account <service>` (x / producthunt / peerlist / peerpush) to save the login for Claude Code."

---

## Final report (send back to the owner, and the owner forwards it to Claude Code)
- A1 workflow enabled: yes/no
- A2 GitHub token created: yes/no (saved by owner: yes/no)
- B1 / B2 Stripe keys created: yes/no each (saved: yes/no)
- B3 business description: saved / review triggered
- C1 Cloudflare account: name …
- C2 hello@agentoolrank.com: working yes/no
- C3 Cloudflare token: created yes/no (saved: yes/no)
- D accounts: X @… / Product Hunt @… / Peerlist @… / PeerPush submitted (queue position …)
- Anything unexpected, or anything the owner still needs to do
