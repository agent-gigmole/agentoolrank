"""Read-only: confirm which accounts are signed in on the dedicated Chrome."""
import asyncio, re
from browser import page_session

async def main():
    async with page_session() as pg:
        await pg.goto("https://myaccount.google.com/", timeout=45000)
        await pg.wait_for_timeout(2500)
        body = await pg.inner_text("body")
        m = re.search(r"[\w.+-]+@[\w-]+\.[\w.]+", body)
        print("google:", pg.url.split("?")[0], "|", m.group(0) if m else "(no email visible)")

        await pg.goto("https://github.com/settings/profile", timeout=45000)
        await pg.wait_for_timeout(1500)
        login = await pg.evaluate("document.querySelector('meta[name=\"user-login\"]')?.content || ''")
        print("github:", pg.url.split("?")[0], "|", login or "(not signed in)")

        await pg.goto("https://dashboard.stripe.com/settings/payouts", timeout=60000)
        await pg.wait_for_timeout(4000)
        print("stripe:", pg.url.split("?")[0], "|", (await pg.title())[:80])

asyncio.run(main())
