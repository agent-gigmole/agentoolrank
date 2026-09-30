"""Print <option> labels of every <select> on the tab matching argv[1] (read-only)."""
import asyncio, sys
from playwright.async_api import async_playwright
from browser import ensure_chrome

async def main(match):
    async with async_playwright() as p:
        b = await p.chromium.connect_over_cdp(ensure_chrome(), timeout=15000)
        pg = next(x for x in reversed(b.contexts[0].pages) if match in x.url)
        print(await pg.evaluate("() => [...document.querySelectorAll('select')].map(s => (s.name||s.id)+': '+[...s.options].map(o=>o.value+'='+o.text).join(' | '))"))

asyncio.run(main(sys.argv[1]))
