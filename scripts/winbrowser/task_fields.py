"""Read-only: list every visible form control on the tab matching <match>: tag, type, name, required, label/placeholder. task_fields.py <match>"""
import asyncio, sys
from playwright.async_api import async_playwright
from browser import ensure_chrome

async def main(match):
    async with async_playwright() as pw:
        ctx = (await pw.chromium.connect_over_cdp(ensure_chrome(), timeout=15000)).contexts[0]
        page = next((p for p in reversed(ctx.pages) if match in p.url), None)
        if not page: print("no tab"); return
        rows = await page.evaluate("""() => [...document.querySelectorAll('input,textarea,select')].filter(e => e.offsetParent || e.type==='checkbox' || e.tagName==='SELECT').map(e => {
            const lab = (e.labels && e.labels[0] ? e.labels[0].innerText : '') || e.placeholder || e.getAttribute('aria-label') || '';
            const opts = e.tagName==='SELECT' ? [...e.options].slice(0,12).map(o=>o.value+'/'+o.text.trim()).join(' | ') : '';
            return [e.tagName, e.type, e.name, e.required ? 'REQ' : '', lab.trim().replace(/\\s+/g,' ').slice(0,60), opts.slice(0,200)].join(' :: ');
        })""")
        for r in rows: print(r)

asyncio.run(main(*sys.argv[1:]))
