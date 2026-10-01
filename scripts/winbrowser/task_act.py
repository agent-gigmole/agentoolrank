"""Step-wise browser actions on a persistent tab.

Usage: task_act.py <steps.json>
steps.json: {"match": "alternativeto.net", "open": "https://...", "steps": [
   {"click_text": "Consent"}, {"click": "css=button#x"}, {"fill": ["css=input[name=q]", "text"]},
   {"goto": "https://..."}, {"wait": 2000}, {"upload": ["css=input[type=file]", "C:\\\\path.png"]},
   {"select": ["css=select", "value"]}, {"press": ["css=input", "Enter"]}, {"js": "() => document.title"}]}
Reuses an existing tab whose URL contains "match" (else opens "open"); leaves the tab open.
Handles popups (e.g. "Sign in with Google") by switching to the newest page.
Prints a compact state summary after the steps.
"""
import asyncio, json, sys
from playwright.async_api import async_playwright
from browser import ensure_chrome

SUMMARY_JS = """() => {
  const t = el => (el.type === 'password' ? '<hidden>' : (el.innerText || el.value || el.getAttribute('aria-label') || el.placeholder || '')).trim().replace(/\\s+/g,' ').slice(0,70);
  const vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  return {
    h: [...document.querySelectorAll('h1,h2,h3')].filter(vis).map(t).filter(Boolean).slice(0,10),
    buttons: [...document.querySelectorAll('button,a[role=button],input[type=submit],[role=option],[role=link]')].filter(vis).map(t).filter(Boolean).slice(0,25),
    inputs: [...document.querySelectorAll('input:not([type=hidden]),textarea,select')].filter(vis).map(e => (e.name||e.id||e.type)+':'+(e.placeholder||e.getAttribute('aria-label')||'')+(e.value?'='+(e.type==='password'?'<hidden>':String(e.value).slice(0,30)):'')).slice(0,25),
    errors: [...document.querySelectorAll('[role=alert],.error,.errors,.invalid-feedback,[class*=error]')].filter(e => vis(e) && !['INPUT','TEXTAREA','SELECT'].includes(e.tagName)).map(t).filter(Boolean).slice(0,6),
    text: document.body.innerText.replace(/\\s+/g,' ').slice(0,600),
    captcha: !!document.querySelector('iframe[src*=captcha],iframe[src*=turnstile],iframe[src*=recaptcha],.g-recaptcha,.cf-turnstile,iframe[title*=challenge]')
  };
}"""

async def main(path):
    spec = json.load(open(path, encoding="utf-8"))
    async with async_playwright() as p:
        browser = await p.chromium.connect_over_cdp(ensure_chrome(), timeout=15000)
        ctx = browser.contexts[0]
        page = next((pg for pg in reversed(ctx.pages) if spec.get("match") and spec["match"] in pg.url), None)
        if page is None:
            page = await ctx.new_page()
            await page.goto(spec["open"], timeout=60000)
        for st in spec.get("steps", []):
            (k, v), = st.items()
            before = len(ctx.pages)
            try:
                if k == "goto": await page.goto(v, timeout=60000)
                elif k == "click_text": await page.get_by_text(v, exact=st.get("exact", False)).first.click(timeout=15000)
                elif k == "click_role": await page.get_by_role(v[0], name=v[1]).first.click(timeout=15000)
                elif k == "click": await page.locator(v.removeprefix("css=")).first.click(timeout=15000)
                elif k == "fill": await page.locator(v[0].removeprefix("css=")).first.fill(v[1], timeout=15000)
                elif k == "press": await page.locator(v[0].removeprefix("css=")).first.press(v[1], timeout=15000)
                elif k == "select": await page.locator(v[0].removeprefix("css=")).first.select_option(v[1], timeout=15000)
                elif k == "upload": await page.locator(v[0].removeprefix("css=")).first.set_input_files(v[1], timeout=15000)
                elif k == "wait": await page.wait_for_timeout(v)
                elif k == "frame_click":  # [iframe selector, selector inside it]
                    await page.frame_locator(v[0].removeprefix("css=")).locator(v[1].removeprefix("css=")).first.click(timeout=15000)
                elif k == "click_xy": await page.mouse.click(v[0], v[1])  # viewport coords, e.g. read off a screenshot
                elif k == "type": await page.keyboard.type(v, delay=30)
                elif k == "key": await page.keyboard.press(v)  # press a key on whatever has focus (e.g. Enter in Typeform)
                elif k == "insert_text":  # [selector, text]: focus then insert like a paste (keeps newlines in rich editors)
                    await page.locator(v[0].removeprefix("css=")).first.click(timeout=15000)
                    await page.keyboard.insert_text(v[1])
                elif k == "fill_secret":  # [selector, path to a file holding the value]; value is never printed
                    secret = open(v[1], encoding="utf-8").read().strip()
                    await page.locator(v[0].removeprefix("css=")).first.fill(secret, timeout=15000)
                    v = [v[0], "<secret>"]
                elif k == "check": await page.locator(v.removeprefix("css=")).first.check(timeout=15000)
                elif k == "js":  # run a JS expression in the page (e.g. tick custom-styled checkboxes); result printed
                    print("   js ->", str(await page.evaluate(v))[:200])
                print(f"ok  {k}: {str(v)[:60]}")
            except Exception as e:
                print(f"ERR {k}: {str(v)[:60]} -> {str(e).splitlines()[0][:160]}")
                break
            await page.wait_for_timeout(800)
            if len(ctx.pages) > before:  # popup opened (e.g. OAuth)
                page = ctx.pages[-1]
                await page.wait_for_load_state("domcontentloaded")
                print("-> switched to popup:", page.url[:80])
        await page.wait_for_timeout(spec.get("settle", 1500))
        print("URL:", page.url[:150])
        print("TITLE:", await page.title())
        for k, v in (await page.evaluate(SUMMARY_JS)).items():
            print(f"{k.upper()}:", v)
        if spec.get("shot"):
            await page.screenshot(path=spec["shot"])

asyncio.run(main(sys.argv[1]))
