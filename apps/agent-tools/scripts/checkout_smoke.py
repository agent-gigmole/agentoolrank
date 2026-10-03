#!/usr/bin/env python3
"""Daily checkout smoke test (pipeline checkout-smoke, timer agentoolrank-checkout-smoke.timer, 07:40 Beijing).

Same idea as imagehub scripts/checkout_smoke.py (agentkit rollout checkout-smoke, 10-03 22:26): a phone-sized fresh
browser opens the site with ?internal=1 (our analytics ignore it), taps through to the two things people can pay for and
must land on checkout.stripe.com showing the product name and the price the page quoted:
  1. Submit Kit: home → "Submit Kit" link → /submit-kit shows $29 and the buy button → the same request the button sends
     → Stripe shows "AgentoolRank Submit Kit (30 days)" and $29.00.
  2. Featured listing: /tool/langchain#maintainers shows "$49" → the same request the button sends → Stripe shows
     "AgentoolRank featured listing (7 days)" and $49.00.
Nothing is paid; sessions carry src=smoke and their ids go to ops/smoke/test-sessions.txt (unpaid sessions never reach
the payments table, so reports can't count them). Screenshots: ops/smoke/<date>-*.png. Exit 1 + bus alert on failure.
"""
import datetime as dt, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
SITE = "https://agentoolrank.com"
OUT = os.path.join(ROOT, "ops/smoke")


def stripe_check(pg, url, name, amount, shot, day):
    pg.goto(url, wait_until="domcontentloaded", timeout=60000)
    pg.get_by_text(name).first.wait_for(timeout=60000)  # Stripe keeps connections open; wait for the product line
    text = pg.inner_text("body").replace("US$", "$")
    pg.screenshot(path=f"{OUT}/{day}-{shot}.png")
    sid = re.search(r"cs_(?:live|test)_[A-Za-z0-9]+", pg.url)
    if sid:
        with open(f"{OUT}/test-sessions.txt", "a") as f:
            f.write(sid.group(0) + "\n")
    problems = []
    if name not in text:
        problems.append(f"product name '{name}' missing")
    if amount not in text:
        problems.append(f"page quoted {amount} but Stripe does not show it")
    if problems:
        raise AssertionError("; ".join(problems))


def post(pg, path, body):
    r = pg.evaluate(
        "([p, b]) => fetch(p, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(b)}).then(r => r.json())",
        [path, body],
    )
    if not r.get("url"):
        raise AssertionError(f"{path} returned no checkout url: {r}")
    return r["url"]


def main():
    from playwright.sync_api import sync_playwright
    day = dt.datetime.now(dt.timezone(dt.timedelta(hours=8))).strftime("%Y-%m-%d")
    os.makedirs(OUT, exist_ok=True)
    step = "start"
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(**p.devices["iPhone 13"])
        pg = ctx.new_page()
        try:
            step = "home"
            pg.goto(f"{SITE}/?internal=1", wait_until="domcontentloaded", timeout=60000)
            pg.get_by_test_id("home-submit-kit").click()
            pg.wait_for_url("**/submit-kit**", timeout=30000)
            step = "submit-kit page"
            pg.get_by_test_id("kit-buy").first.wait_for(timeout=30000)  # the page has two buy buttons (top and after the free list)
            if "$29" not in pg.inner_text("body"):
                raise AssertionError("/submit-kit does not show $29")
            pg.screenshot(path=f"{OUT}/{day}-1-submit-kit.png")
            step = "kit → stripe"
            stripe_check(pg, post(pg, "/api/kit-checkout", {"src": "smoke"}), "AgentoolRank Submit Kit (30 days)", "$29.00", "2-stripe-kit", day)

            step = "tool page featured"
            pg.goto(f"{SITE}/tool/langchain#maintainers", wait_until="domcontentloaded", timeout=60000)
            if "$49" not in pg.inner_text("body"):
                raise AssertionError("/tool/langchain maintainer box does not show $49")
            pg.screenshot(path=f"{OUT}/{day}-3-tool-featured.png")
            step = "featured → stripe"
            stripe_check(pg, post(pg, "/api/checkout", {"slug": "langchain", "plan": "featured", "src": "smoke"}),
                         "AgentoolRank featured listing (7 days)", "$49.00", "4-stripe-featured", day)
            print(f"checkout smoke OK {day}: Submit Kit $29.00 and featured $49.00 both reach Stripe with the right name; sessions recorded as test")
        except Exception as e:  # noqa: BLE001
            try:
                pg.screenshot(path=f"{OUT}/{day}-fail-{step.replace(' ', '-').replace('→', 'to')}.png")
            except Exception:
                pass
            msg = f"ai-directory 付款路径冒烟失败（{day}，步骤：{step}）：{type(e).__name__}: {str(e)[:200]}。截图 ops/smoke/。"
            print(msg, file=sys.stderr)
            if not os.environ.get("SMOKE_NO_ALERT"):
                subprocess.run(["env", "-u", "BUS_SESSION_NAME", "-u", "BUS_TOKEN", "bus-send", "agentkit", msg], capture_output=True)
            sys.exit(1)
        finally:
            b.close()


if __name__ == "__main__":
    main()
