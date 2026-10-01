#!/usr/bin/env bash
# Append one row to the shared cross-project directory log. Usage: scripts/dirlog.sh <domain> <result> "<detail>"
set -euo pipefail
python3 - "$@" <<'PY'
import csv, sys, datetime
d, r, detail = sys.argv[1:4]
assert r in {"submitted","skip","badge","x-verify","captcha","todo","retry"}, r
with open("/home/qmt/data/backlinks/directory-log.csv", "a", newline="") as f:
    csv.writer(f).writerow([d, datetime.date.today().isoformat(), "ai-directory", r, detail])
print("logged", d, r)
PY
