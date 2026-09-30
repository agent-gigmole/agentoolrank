"""Shared helpers for driving the dedicated Windows Chrome (profile C:\\agentoolrank-chrome) from WSL.

Runs under Windows Python (C:\\pixtidy-browser\\venv). Import from a task script:
    from browser import page_session
    async with page_session() as pg: await pg.goto(...)
Why Windows-side: WSL2 -> Windows CDP over portproxy/relays is unreliable; connecting on
[::1] from Windows itself is stable. Proxy env vars must be bypassed when fetching the ws URL.
"""
import contextlib, json, subprocess, time, urllib.request
from playwright.async_api import async_playwright

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PROFILE = r"C:\agentoolrank-chrome"
CDPS = ["http://127.0.0.1:9223", "http://[::1]:9223"]  # Chrome may bind either loopback
_opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def ws_url(timeout=5):
    last = None
    for cdp in CDPS:
        try:
            return json.load(_opener.open(f"{cdp}/json/version", timeout=timeout))["webSocketDebuggerUrl"]
        except Exception as e:
            last = e
    raise last


def ensure_chrome():
    try:
        return ws_url(2)
    except Exception:
        subprocess.Popen([CHROME, "--remote-debugging-port=9223", f"--user-data-dir={PROFILE}",
                          "--no-first-run", "--no-default-browser-check", "about:blank"])
        for _ in range(30):
            time.sleep(0.5)
            try:
                return ws_url(2)
            except Exception:
                pass
        raise RuntimeError("Chrome did not start with remote debugging")


@contextlib.asynccontextmanager
async def page_session():
    async with async_playwright() as p:
        browser = await p.chromium.connect_over_cdp(ensure_chrome(), timeout=15000)
        page = await browser.contexts[0].new_page()
        try:
            yield page
        finally:
            await page.close()
