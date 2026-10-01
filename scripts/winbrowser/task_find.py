"""Read-only: on the tab matching <match>, print whether <text> is visible in the page and the inputs' current values (passwords hidden). task_find.py <match> <text>"""
import asyncio, sys
from playwright.async_api import async_playwright
from browser import ensure_chrome

async def main(match, text):
    async with async_playwright() as pw:
        ctx = (await pw.chromium.connect_over_cdp(ensure_chrome(), timeout=15000)).contexts[0]
        page = next((p for p in reversed(ctx.pages) if match in p.url), None)
        if not page: print("no tab"); return
        body = await page.evaluate("() => document.body.innerText")
        i = body.find(text)
        print("FOUND" if i >= 0 else "NOT FOUND", repr(body[max(0, i-100):i+200]) if i >= 0 else "")
        vals = await page.evaluate("""() => [...document.querySelectorAll('input,textarea')].filter(e => e.offsetParent).map(e => (e.name||e.id)+'='+(e.type==='password'?'<hidden>':(e.value||'').slice(0,40)))""")
        print(vals[:20])

asyncio.run(main(*sys.argv[1:]))
