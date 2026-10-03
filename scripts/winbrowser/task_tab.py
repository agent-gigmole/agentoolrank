"""task_tab.py <cmd> ...  — one-step-at-a-time tab helper for the dedicated Chrome (generalized from imagehub's g.py/inspect_form.py).

Every command except `probe` acts on an existing tab picked by URL substring (the most recent match).

  tabs                          list open tabs
  open <url>                    open a new tab, print the first 1500 chars of text
  probe <url> [<url>...]        open each URL, print visible form fields + payment/captcha/login/badge keywords, CLOSE the tab
  text <sub> [anchor] [n]       page text from `anchor`, n chars (default 2500)
  form <sub>                    visible inputs/selects/buttons with current values (password values hidden)
  fill <sub> <css> <text>       fill one field and read the value back
  click <sub> <text|x,y> [ms]   click the visible leaf element whose text equals <text> (or coordinates); native confirm()
                                dialogs are ACCEPTED and their message printed (Playwright silently dismisses them otherwise)
  eval <sub> <js>               evaluate JS, print JSON (async IIFEs are awaited)
  goto <sub> <url>              navigate an existing tab
  shot <sub> [file]             full-page screenshot (never on pages that show card numbers or secrets)
  close <sub>                   close the matching tab
  tidy [keep-substr ...]        close every tab except those matching a keep substring — run after each site is done

Rules (see SKILL.md): close a site's tab as soon as it is submitted or skipped; don't fill passwords with `fill` (use task_act fill_secret).
"""
import asyncio
import base64
import json
import re
import sys

from playwright.async_api import async_playwright

from browser import ensure_chrome, stamp, stamp_of

FIELDS = """() => [...document.querySelectorAll('input,textarea,select,button')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&e.type!=='hidden'}).map(e=>{
 let lab=''; if(e.id){const l=document.querySelector('label[for="'+e.id+'"]'); if(l) lab=l.innerText}
 if(!lab){const l=e.closest('label'); if(l) lab=l.innerText}
 const val = e.type==='password' ? (e.value?'<hidden>':'') : (e.value||'');
 return [e.tagName.toLowerCase(), e.type||'', e.name||'', e.id||'', (lab||e.placeholder||e.innerText||e.getAttribute('aria-label')||'').slice(0,50).replace(/\\n/g,' '),
   val?('='+String(val).slice(0,60)):'', e.tagName==='SELECT'?[...e.options].map(o=>o.text).slice(0,40).join('/'):'']})"""
LEAF = """(t)=>{const els=[...document.querySelectorAll('a,button,span,div,label,p,li,h1,h2,h3,summary,input[type=submit]')].filter(e=>(e.childElementCount===0||e.tagName==='A'||e.tagName==='BUTTON')&&(e.textContent||e.value||'').trim()===t);
  for(const e of els){const r0=e.getBoundingClientRect(); if(r0.width>0){e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]}} return null}"""
KW = re.compile(r"(?i)(captcha|turnstile|recaptcha|hcaptcha|\$\d+(?:\.\d+)?|free|pricing|log ?in|sign in|sign up|dofollow|nofollow|backlink|badge|embed|tweet|verify)")


async def pick(ctx, sub):
    m = [x for x in ctx.pages if sub in x.url]
    if not m:
        sys.exit(f"no tab matches {sub!r}; open tabs: {[x.url[:80] for x in ctx.pages]}")
    # page list order is not creation order over a fresh CDP connection: prefer the most recently stamped match
    marks = [await stamp_of(x) for x in m]
    return m[marks.index(max(marks))] if max(marks) >= 0 else m[-1]


async def main(a):
    cmd = a[0]
    async with async_playwright() as p:
        b = await p.chromium.connect_over_cdp(ensure_chrome(), timeout=15000)
        ctx = b.contexts[0]
        if cmd == "tabs":
            for x in ctx.pages:
                print(x.url[:140])
            return
        if cmd == "tidy":
            keep = a[1:]
            n = 0
            for x in list(ctx.pages):
                if not any(k in x.url for k in keep):
                    await x.close()
                    n += 1
            print(f"closed {n}; left {[x.url[:80] for x in ctx.pages]}")
            return
        if cmd == "open":
            pg = await ctx.new_page()
            await pg.goto(a[1], wait_until="domcontentloaded", timeout=45000)
            await pg.wait_for_timeout(2500)
            await stamp(pg)
            print(pg.url)
            print((await pg.evaluate("document.body.innerText"))[:1500])
            return
        if cmd == "probe":
            for url in a[1:]:
                pg = await ctx.new_page()
                try:
                    await pg.goto(url, timeout=45000, wait_until="domcontentloaded")
                    await pg.wait_for_timeout(5000)
                    print("=====", url, "->", pg.url, "|", await pg.title())
                    for f in await pg.evaluate(FIELDS):
                        print("  ", f)
                    t = await pg.evaluate("document.body.innerText")
                    print("  kw:", sorted(set(m.lower() for m in KW.findall(t)))[:20])
                except Exception as e:  # noqa: BLE001 - report and move on to the next site
                    print("=====", url, "ERR", str(e)[:200])
                finally:
                    await pg.close()
            return
        pg = await pick(ctx, a[1])
        if cmd != "close":
            await stamp(pg)
        if cmd == "text":
            t = (await pg.evaluate("document.body.innerText")).replace("\n", " | ")
            i = t.find(a[2]) if len(a) > 2 and a[2] else 0
            n = int(a[3]) if len(a) > 3 else 2500
            print(pg.url[:140])
            print(t[max(i, 0): max(i, 0) + n])
        elif cmd == "form":
            for f in await pg.evaluate(FIELDS):
                print(f)
        elif cmd == "fill":
            loc = pg.locator(a[2]).first
            await loc.scroll_into_view_if_needed()
            await loc.click()
            await loc.fill(a[3])
            print("value:", (await loc.input_value())[:200])
        elif cmd == "click":
            dialogs = []

            async def on_dialog(d):
                dialogs.append(d.message)
                await d.accept()

            pg.on("dialog", lambda d: asyncio.ensure_future(on_dialog(d)))
            xy = [int(v) for v in a[2].split(",")] if re.fullmatch(r"\d+,\d+", a[2]) else await pg.evaluate(LEAF, a[2])
            print("xy", xy)
            if xy:
                await pg.mouse.click(xy[0], xy[1])
            await pg.wait_for_timeout(int(a[3]) if len(a) > 3 else 2500)
            if dialogs:
                print("accepted dialog(s):", dialogs)
            print(pg.url[:140])
        elif cmd == "eval":
            r = await pg.evaluate(a[2])
            print(r[:4000] if isinstance(r, str) else json.dumps(r, ensure_ascii=False)[:4000])
        elif cmd == "goto":
            await pg.goto(a[2], wait_until="domcontentloaded", timeout=45000)
            await pg.wait_for_timeout(2500)
            await stamp(pg)  # navigation may clear window.name
            print(pg.url)
            print((await pg.evaluate("document.body.innerText"))[:1500])
        elif cmd == "shot":
            path = a[2] if len(a) > 2 else "tab.png"
            await pg.screenshot(path=path, full_page=True)
            print("saved", path)
        elif cmd == "close":
            await pg.close()
            print("closed")
        else:
            sys.exit(__doc__)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    asyncio.run(main(sys.argv[1:]))
