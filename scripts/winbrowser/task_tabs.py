"""Close every tab except those whose URL contains one of the keep patterns; bring the first keep pattern's tab to front.
task_tabs.py <keep1> [keep2 ...]   (also: task_tabs.py --list)"""
import asyncio, sys
from playwright.async_api import async_playwright
from browser import ensure_chrome

async def main(keep):
    async with async_playwright() as pw:
        ctx = (await pw.chromium.connect_over_cdp(ensure_chrome(), timeout=15000)).contexts[0]
        pages = list(ctx.pages)
        if keep == ["--list"]:
            for p in pages: print(p.url[:120])
            return
        closed = 0
        for p in pages:
            if not any(k in p.url for k in keep):
                await p.close(); closed += 1
        left = list(ctx.pages)
        front = next((p for p in left if keep[0] in p.url), None)
        if front: await front.bring_to_front()
        print(f"closed {closed}, left {len(left)}:"); [print("  ", p.url[:100]) for p in left]

asyncio.run(main(sys.argv[1:]))
