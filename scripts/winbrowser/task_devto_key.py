"""Generate a dev.to API key on /settings/extensions and save it to <outfile> without printing it.
task_devto_key.py <description> <outfile>"""
import asyncio, re, sys
from playwright.async_api import async_playwright
from browser import ensure_chrome

async def main(desc, outfile):
    async with async_playwright() as pw:
        ctx = (await pw.chromium.connect_over_cdp(ensure_chrome(), timeout=15000)).contexts[0]
        page = next((p for p in reversed(ctx.pages) if "dev.to/settings/extensions" in p.url), None)
        if not page: print("no tab"); return
        # Keys are listed in <details> blocks (collapsed, so read textContent, not innerText).
        read = "(d) => [...document.querySelectorAll('details')].filter(e => e.querySelector('summary')?.textContent.trim() === d).map(e => e.textContent)"
        if not await page.evaluate(read, desc):
            await page.locator("input[name='api_secret[description]']").first.fill(desc)
            await page.get_by_role("button", name=re.compile("Generate API Key", re.I)).click()
            await page.wait_for_timeout(4000)
        texts = await page.evaluate(read, desc)
        new = sorted({k for t in texts for k in re.findall(r"\b[a-zA-Z0-9]{24}\b", t)})
        if len(new) != 1: print(f"expected 1 new key, found {len(new)}"); return
        open(outfile, "w").write(new[0])
        print(f"saved key ({len(new[0])} chars)")

asyncio.run(main(sys.argv[1], sys.argv[2]))
