"""Leave exactly one tab open (agentkit rollout browser-tidy 10-04: the Windows box has 4-5 GB free). run.sh calls this on
exit of every task, success or failure. Unlike new_ladar (keeps the first tab) we keep the NEWEST tab: our flows open a
tab in one run.sh call and keep working on it in the next calls (eval / click / fill), so the working tab must survive."""
import asyncio
from playwright.async_api import async_playwright
from browser import ensure_chrome


async def main():
    async with async_playwright() as p:
        b = await p.chromium.connect_over_cdp(ensure_chrome(), timeout=15000)
        ctx = b.contexts[0]
        pages = list(ctx.pages)
        if not pages:
            await ctx.new_page()
        for pg in pages[:-1]:
            print("close", pg.url[:80])
            await pg.close()
        print("tabs left:", len(ctx.pages))

asyncio.run(main())
