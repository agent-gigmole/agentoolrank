import asyncio, sys
from playwright.async_api import async_playwright
from browser import ensure_chrome
async def main(match, name, pat):
    async with async_playwright() as pw:
        ctx = (await pw.chromium.connect_over_cdp(ensure_chrome(), timeout=15000)).contexts[0]
        page = next((p for p in reversed(ctx.pages) if match in p.url), None)
        r = await page.evaluate("([n,p]) => [...document.querySelector(`select[name='${n}']`).options].map(o=>o.value+'/'+o.text.trim()).filter(s=>new RegExp(p,'i').test(s))", [name, pat])
        print(r[:40])
asyncio.run(main(*sys.argv[1:]))
