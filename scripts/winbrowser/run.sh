#!/usr/bin/env bash
# Run a browser task on the Windows side against the dedicated AgentoolRank Chrome
# (profile C:\agentoolrank-chrome, CDP [::1]:9223). Pattern from imagehub (RECIPES#windows-browser-tasks).
# Usage: scripts/winbrowser/run.sh <task.py> [args...]
set -euo pipefail
# Browser isolation (agentkit browser-lock): wait if someone borrowed this Chrome or the owner took over.
lock=/home/qmt/project/agentkit/bin/browser-lock
if [ -x "$lock" ] && ! "$lock" check agentoolrank-chrome --who ai-directory; then
  echo "agentoolrank-chrome is locked by someone else (see: $lock status agentoolrank-chrome); not running." >&2
  exit 3
fi
here="$(cd "$(dirname "$0")" && pwd)"
dest=/mnt/c/agentoolrank-browser
py=/mnt/c/pixtidy-browser/venv/Scripts/python.exe   # shared Playwright venv, not modified
mkdir -p "$dest"
cp "$here/browser.py" "$dest/browser.py"
cp "$here/task_tidy.py" "$dest/task_tidy.py"
task="$(basename "$1")"; cp "$1" "$dest/$task"; shift
# File arguments (e.g. steps.json) are WSL paths Windows Python can't open: copy them over.
args=()
for a in "$@"; do
  if [ -f "$a" ]; then cp "$a" "$dest/$(basename "$a")"; args+=("$(basename "$a")"); else args+=("$a"); fi
done
cd "$dest"
# browser-tidy (agentkit 10-04): on any exit, close all but the newest tab so tabs never pile up on the Windows box.
tidy() { [ "$task" = "task_tidy.py" ] || PYTHONIOENCODING=utf-8 WSLENV=PYTHONIOENCODING "$py" task_tidy.py 2>&1 | tr -d '\r' | tail -1 >&2 || true; }
trap tidy EXIT
PYTHONIOENCODING=utf-8 WSLENV=PYTHONIOENCODING "$py" "$task" "${args[@]}" 2>&1 | tr -d '\r'
