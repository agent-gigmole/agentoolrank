"""Resubmit sitemap.xml to Google Search Console (daily-ops, after IndexNow) so new pages such as /downloads get crawled.
Needs the full webmasters scope (readonly can't submit). Service account file: <repo root>/gsc-service-account.json.
Prints one line; exit 1 on failure so the daily pipeline flags it."""
import json, os, sys, time, urllib.parse, urllib.request

import jwt

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
SA = json.load(open(os.path.join(ROOT, "gsc-service-account.json")))
now = int(time.time())
assertion = jwt.encode({"iss": SA["client_email"], "scope": "https://www.googleapis.com/auth/webmasters",
                        "aud": "https://oauth2.googleapis.com/token", "iat": now, "exp": now + 3600}, SA["private_key"], algorithm="RS256")
token = json.load(urllib.request.urlopen("https://oauth2.googleapis.com/token", urllib.parse.urlencode(
    {"grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer", "assertion": assertion}).encode()))["access_token"]
site = urllib.parse.quote("sc-domain:agentoolrank.com", safe="")
feed = urllib.parse.quote("https://agentoolrank.com/sitemap.xml", safe="")
try:
    r = urllib.request.urlopen(urllib.request.Request(f"https://www.googleapis.com/webmasters/v3/sites/{site}/sitemaps/{feed}",
                                                      method="PUT", headers={"Authorization": f"Bearer {token}"}))
    print(f"gsc sitemap resubmit {r.status}")
except Exception as e:  # noqa: BLE001
    print(f"gsc sitemap resubmit failed: {e}")
    sys.exit(1)
