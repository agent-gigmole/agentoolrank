"""Print the permalink of the newest post on an X profile tab (read-only): task_latest_post.py <handle>"""
import asyncio, sys
from playwright.async_api import async_playwright
from browser import ensure_chrome

async def main(handle):
    async with async_playwright() as p:
        b = await p.chromium.connect_over_cdp(ensure_chrome(), timeout=15000)
        pg = next(x for x in reversed(b.contexts[0].pages) if "x.com" in x.url)
        hrefs = await pg.evaluate(f"() => [...document.querySelectorAll('a[href*=\"/{handle}/status/\"]')].map(a => a.getAttribute('href')).filter(h => /status\\/\\d+$/.test(h))")
        print("https://x.com" + hrefs[0] if hrefs else "not found")

asyncio.run(main(sys.argv[1]))
