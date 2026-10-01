"""Read-only: screenshot the tab whose URL contains <match> to <outfile> (PNG). task_screenshot.py <match> <outfile>"""
import asyncio, sys
from playwright.async_api import async_playwright
from browser import ensure_chrome

async def main(match, out):
    async with async_playwright() as pw:
        ctx = (await pw.chromium.connect_over_cdp(ensure_chrome(), timeout=15000)).contexts[0]
        page = next((p for p in reversed(ctx.pages) if match in p.url), None)
        if not page: print("no tab"); return
        await page.screenshot(path=out, full_page=False)
        print("saved", out)

asyncio.run(main(*sys.argv[1:]))
