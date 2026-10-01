"""Read-only: print visible dialog/modal text + its buttons/links on the tab whose URL contains <match>. task_dialog.py <match>"""
import asyncio, sys
from playwright.async_api import async_playwright
from browser import ensure_chrome

async def main(match):
    async with async_playwright() as pw:
        ctx = (await pw.chromium.connect_over_cdp(ensure_chrome(), timeout=15000)).contexts[0]
        page = next((p for p in reversed(ctx.pages) if match in p.url), None)
        if not page:
            print("no tab matching", match); return
        out = await page.evaluate("""() => {
          const vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
          const ds = [...document.querySelectorAll('[role=dialog],[aria-modal=true],.modal,[class*=Modal],[class*=modal]')].filter(vis);
          return ds.slice(0,3).map(d => ({text: d.innerText.replace(/\\s+/g,' ').slice(0,800),
            controls: [...d.querySelectorAll('button,a,input,select')].filter(vis).map(e => e.tagName+':'+(e.innerText||e.value||e.getAttribute('aria-label')||e.name||'').trim().slice(0,50))}));
        }""")
        for d in out: print(d)

asyncio.run(main(sys.argv[1]))
