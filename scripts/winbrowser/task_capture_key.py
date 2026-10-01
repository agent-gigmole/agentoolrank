"""Fill a key name, click Generate, and save the newly shown secret to <outfile> without printing it.
task_capture_key.py <match> <key_name> <outfile> [prefix]
Looks in the visible dialog for an input/code/text token starting with <prefix> (default 'xkeysib-')."""
import asyncio, sys, re
from playwright.async_api import async_playwright
from browser import ensure_chrome

async def main(match, name, outfile, prefix="xkeysib-"):
    async with async_playwright() as pw:
        ctx = (await pw.chromium.connect_over_cdp(ensure_chrome(), timeout=15000)).contexts[0]
        page = next((p for p in reversed(ctx.pages) if match in p.url), None)
        if not page: print("no tab"); return
        dlg = page.locator('[role=dialog]').last
        await dlg.locator('input').first.fill(name)
        await dlg.get_by_role('button', name='Generate').click()
        await page.wait_for_timeout(4000)
        text = await page.evaluate("""(prefix) => {
          const vals = [...document.querySelectorAll('input,textarea,code,pre,span,div')].map(e => (e.value || e.innerText || '').trim());
          return vals.find(v => v.startsWith(prefix) && !/\\s/.test(v)) || '';
        }""", prefix)
        if not re.match(re.escape(prefix) + r"[A-Za-z0-9-]{20,}$", text):
            print("key not found on page"); return
        open(outfile, "w").write(text)
        print(f"saved key ({len(text)} chars, prefix {prefix})")

asyncio.run(main(*sys.argv[1:]))
