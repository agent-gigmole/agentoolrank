#!/usr/bin/env python3
"""Google Search Console summary for agentoolrank.com (service account, read-only).
Usage: python3 scripts/gsc_report.py [days=28]
Prints clicks/impressions, top queries and top pages, and page-type totals (compare/alternatives/tool/...)."""
import json, sys, time, urllib.parse, urllib.request, datetime, os, collections
import jwt  # pyjwt

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
SA = json.load(open(os.path.join(ROOT, "gsc-service-account.json")))
SITE = "sc-domain:agentoolrank.com"
days = int(sys.argv[1]) if len(sys.argv) > 1 else 28

now = int(time.time())
assertion = jwt.encode({"iss": SA["client_email"], "scope": "https://www.googleapis.com/auth/webmasters.readonly",
                        "aud": "https://oauth2.googleapis.com/token", "iat": now, "exp": now + 3600}, SA["private_key"], algorithm="RS256")
token = json.load(urllib.request.urlopen("https://oauth2.googleapis.com/token", urllib.parse.urlencode(
    {"grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer", "assertion": assertion}).encode()))["access_token"]

def query(dims, limit=25):
    end = datetime.date.today() - datetime.timedelta(days=2)  # GSC lags ~2 days
    start = end - datetime.timedelta(days=days)
    body = {"startDate": str(start), "endDate": str(end), "dimensions": dims, "rowLimit": limit}
    url = f"https://www.googleapis.com/webmasters/v3/sites/{urllib.parse.quote(SITE, safe='')}/searchAnalytics/query"
    req = urllib.request.Request(url, json.dumps(body).encode(), {"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(req)).get("rows", [])

pages = query(["page"], 1000)
clicks = sum(r["clicks"] for r in pages); imps = sum(r["impressions"] for r in pages)
print(f"GSC last {days}d: clicks {clicks:.0f}, impressions {imps:.0f}")
types = collections.Counter(); type_clicks = collections.Counter()
for r in pages:
    path = urllib.parse.urlparse(r["keys"][0]).path
    t = path.split("/")[1] or "home"
    types[t] += r["impressions"]; type_clicks[t] += r["clicks"]
print("By page type (impressions / clicks):")
for t, n in types.most_common():
    print(f"  {t:14s} {n:6.0f} / {type_clicks[t]:.0f}")
print("Top queries (clicks, impressions, position):")
for r in query(["query"], 15):
    print(f"  {r['clicks']:3.0f} {r['impressions']:5.0f} {r['position']:5.1f}  {r['keys'][0]}")
print("Top pages:")
for r in sorted(pages, key=lambda r: -r["impressions"])[:10]:
    print(f"  {r['clicks']:3.0f} {r['impressions']:5.0f} {r['position']:5.1f}  {r['keys'][0]}")
