"""Leave exactly one tab open (agentkit rollout browser-tidy 10-04: the Windows box has 4-5 GB free). run.sh calls this on
exit of every task, success or failure. Keeps the tab a task worked on last: task_act / task_tab stamp it with
window.name = "ar_keep:<ms>" (browser.stamp). NOT "the last listed page": over a fresh CDP connection Playwright does not
list pages in creation order (new_ladar 10-04 02:40 kept a stale tab and closed the live Google sign-in popup).
Falls back to the last listed page only when no tab carries a stamp."""
import asyncio
from playwright.async_api import async_playwright
from browser import ensure_chrome, stamp_of


async def main():
    async with async_playwright() as p:
        b = await p.chromium.connect_over_cdp(ensure_chrome(), timeout=15000)
        ctx = b.contexts[0]
        pages = list(ctx.pages)
        if not pages:
            await ctx.new_page()
            pages = []
        marks = [await stamp_of(pg) for pg in pages]
        keep = pages[marks.index(max(marks))] if pages and max(marks) >= 0 else (pages[-1] if pages else None)
        for pg in pages:
            if pg is not keep:
                print("close", pg.url[:80])
                await pg.close()
        print("tabs left:", len(ctx.pages), "| kept:", keep.url[:80] if keep else "-")

asyncio.run(main())
