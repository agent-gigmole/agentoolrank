"""Render launch-kit assets into .\\kit: logo-512.png (site icon style) + 1280x800 page screenshots."""
import asyncio, os
from browser import page_session

LOGO = """<html><body style="margin:0"><div id="l" style="width:512px;height:512px;display:flex;align-items:center;
justify-content:center;background:linear-gradient(135deg,#2563eb,#1d4ed8);border-radius:96px;color:#fff;
font:800 250px system-ui,sans-serif;letter-spacing:-12px">AT</div></body></html>"""

SHOTS = {
    "shot-home.png": "https://agentoolrank.com/",
    "shot-alternatives.png": "https://agentoolrank.com/alternatives/claude-code",
    "shot-tool.png": "https://agentoolrank.com/tool/langgraph",
    "shot-compare.png": "https://agentoolrank.com/compare/claude-code-vs-codex",
}

async def main():
    os.makedirs("kit", exist_ok=True)
    async with page_session() as pg:
        await pg.set_content(LOGO)
        await pg.locator("#l").screenshot(path="kit/logo-512.png", omit_background=True)
        await pg.set_viewport_size({"width": 1280, "height": 800})
        for name, url in SHOTS.items():
            await pg.goto(url, timeout=60000)
            await pg.wait_for_timeout(2500)
            await pg.screenshot(path=f"kit/{name}")
            print("ok", name)
    print("done")

asyncio.run(main())
