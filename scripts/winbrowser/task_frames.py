"""Frame-aware steps for embedded forms (e.g. Stripe Checkout / Elements). Never prints field values.
task_frames.py <steps.json>: {"match": "...", "shot": "x.png", "steps": [
  {"click_text": "text"},                       # first visible exact-text element in any frame
  {"fill": ["css selector", "value"]},          # first frame that has a visible match
  {"fill_secret": ["css selector", "UNC path", "optional json key"]},
  {"select": ["css selector", "value"]}, {"wait": ms},
  {"list": "css selector"}                      # print id/name/type/placeholder/aria-label per frame (no values)
]}"""
import asyncio, json, sys
from playwright.async_api import async_playwright
from browser import ensure_chrome

SECRETS = set()  # values filled via fill_secret; redacted from eval output

def redact(x):
    x = str(x)
    for v in SECRETS:
        if v: x = x.replace(v, "<secret>")
    return x

async def first(page, sel):
    for fr in page.frames:
        loc = fr.locator(sel).locator("visible=true")
        try:
            if await loc.count(): return loc.first
        except Exception: pass
    return None

async def main(path):
    spec = json.load(open(path, encoding="utf-8"))
    async with async_playwright() as p:
        b = await p.chromium.connect_over_cdp(ensure_chrome(), timeout=15000)
        page = next(pg for pg in reversed(b.contexts[0].pages) if spec["match"] in pg.url)
        for st in spec["steps"]:
            k, v = next(iter(st.items()))
            try:
                if k == "wait": await page.wait_for_timeout(v)
                elif k == "front": await page.bring_to_front()   # only with explicit permission + browser-lock held
                elif k == "uncheck":
                    loc = await first(page, v)
                    if not loc: raise RuntimeError("selector not found")
                    if await loc.is_checked(): await loc.click(timeout=10000)
                    print("   checked now:", await loc.is_checked())
                elif k == "eval":   # run JS in every frame; JS must not return field values
                    for fr in page.frames:
                        try: r = await fr.evaluate(v)
                        except Exception as e: r = None
                        if r: print("frame", fr.url[:50], redact(r)[:600])
                elif k == "list":
                    for fr in page.frames:
                        items = await fr.eval_on_selector_all(v, "els => els.filter(e => e.offsetParent).map(e => [e.id, e.name, e.type, e.placeholder, e.getAttribute('aria-label'), e.getAttribute('autocomplete')])")
                        if items: print("frame", fr.url[:60], items)
                elif k == "click_text":
                    loc = None
                    for fr in page.frames:
                        l = fr.get_by_text(v, exact=True).locator("visible=true")
                        if await l.count(): loc = l.first; break
                    if not loc: raise RuntimeError("text not found")
                    await loc.click(timeout=10000)
                else:
                    loc = await first(page, v[0])
                    if not loc: raise RuntimeError("selector not found")
                    if k == "fill": await loc.fill(v[1], timeout=10000)
                    elif k == "select": await loc.select_option(v[1], timeout=10000)
                    elif k == "fill_secret":
                        raw = open(v[1], encoding="utf-8").read()
                        val = (json.loads(raw)[v[2]] if len(v) > 2 else raw).strip()
                        SECRETS.add(val); await loc.fill(val, timeout=10000); val = None
                        v = [v[0], "<secret>"]
                print(f"ok  {k}: {str(v)[:70]}")
            except Exception as e:
                print(f"ERR {k}: {str(v)[:70]} -> {str(e).splitlines()[0][:140]}"); break
            await page.wait_for_timeout(500)
        if spec.get("shot"): await page.screenshot(path=spec["shot"])

asyncio.run(main(sys.argv[1]))
