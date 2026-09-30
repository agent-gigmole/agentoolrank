"""Product Hunt gallery shots (1270x760) into .\\kit\\ph-*.png."""
import asyncio, os
from browser import page_session

SHOTS = {
    "ph-1-home.png": "https://agentoolrank.com/",
    "ph-2-report.png": "https://agentoolrank.com/report",
    "ph-3-alternatives.png": "https://agentoolrank.com/alternatives/claude-code",
    "ph-4-compare.png": "https://agentoolrank.com/compare/claude-code-vs-codex",
    "ph-5-agents.png": "https://agentoolrank.com/agents",
}

async def main():
    os.makedirs("kit", exist_ok=True)
    async with page_session() as pg:
        await pg.set_viewport_size({"width": 1270, "height": 760})
        for name, url in SHOTS.items():
            await pg.goto(url, timeout=60000)
            await pg.wait_for_timeout(2500)
            await pg.screenshot(path=f"kit/{name}")
            print("ok", name)

asyncio.run(main())
