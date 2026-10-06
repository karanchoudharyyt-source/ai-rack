#!/bin/sh
# Renders every frame into frames/, restarting the browser if it dies; existing frames are skipped.
cd "$(dirname "$0")"
mkdir -p frames logs
for attempt in 1 2 3 4 5 6; do
  [ "$(ls frames | grep -c '\.jpg$')" -ge 990 ] && break
  node grab.js --all frames 0 990 >> logs/render.log 2>&1
done
echo "done: $(ls frames | grep -c '\.jpg$') frames" >> logs/render.log
