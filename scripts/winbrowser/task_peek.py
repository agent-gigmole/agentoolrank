"""Read-only page inspection: task_peek.py <url> [wait_ms]. Prints url, title, headings, buttons, inputs, visible text head."""
import asyncio, sys
from browser import page_session

async def main(url, wait):
    async with page_session() as pg:
        await pg.goto(url, timeout=60000)
        await pg.wait_for_timeout(wait)
        print("URL:", pg.url)
        print("TITLE:", await pg.title())
        info = await pg.evaluate("""() => {
          const t = el => (el.type === 'password' ? '<hidden>' : (el.innerText || el.value || el.getAttribute('aria-label') || el.placeholder || '')).trim().replace(/\\s+/g,' ').slice(0,80);
          return {
            h: [...document.querySelectorAll('h1,h2,h3')].map(t).filter(Boolean).slice(0,15),
            buttons: [...document.querySelectorAll('button,a[role=button],input[type=submit]')].map(t).filter(Boolean).slice(0,30),
            inputs: [...document.querySelectorAll('input,textarea,select')].map(e => (e.name||e.id||e.type)+':'+(e.placeholder||e.getAttribute('aria-label')||'')).slice(0,30),
            links: [...document.querySelectorAll('a')].map(a => t(a)+' -> '+a.getAttribute('href')).filter(s=>/sign|log|add|submit|suggest|new|launch|app/i.test(s)).slice(0,25),
            text: document.body.innerText.replace(/\\s+/g,' ').slice(0,700),
            captcha: !!document.querySelector('iframe[src*=captcha],iframe[src*=turnstile],iframe[src*=recaptcha],.g-recaptcha,.cf-turnstile')
          };
        }""")
        for k, v in info.items():
            print(f"{k.upper()}:", v)

asyncio.run(main(sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 3000))
