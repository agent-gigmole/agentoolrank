"""List visible links (text -> href) on the tab matching argv[1] whose text or href matches argv[2] (regex)."""
import asyncio, re, sys
from playwright.async_api import async_playwright
from browser import ensure_chrome

async def main(match, pattern):
    async with async_playwright() as p:
        b = await p.chromium.connect_over_cdp(ensure_chrome(), timeout=15000)
        pg = next(x for x in reversed(b.contexts[0].pages) if match in x.url)
        links = await pg.evaluate("() => [...document.querySelectorAll('a')].filter(a => a.getBoundingClientRect().width > 0).map(a => (a.innerText||'').trim().replace(/\\s+/g,' ').slice(0,50) + ' -> ' + a.getAttribute('href'))")
        for l in links:
            if re.search(pattern, l, re.I): print(l)

asyncio.run(main(sys.argv[1], sys.argv[2]))
