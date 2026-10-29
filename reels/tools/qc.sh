#!/usr/bin/env bash
# Quality control: render a 40% preview of a composition and cut it into contact sheets
# (2 frames/s, 30 per sheet) that Claude reads to check timing, overlaps and readability.
# Usage: tools/qc.sh <CompositionId> [out_dir]
set -euo pipefail
ID=$1; OUT=${2:-out/qc_$ID}
cd "$(dirname "$0")/.."
mkdir -p "$OUT"
BROWSER_ARGS=()
[ -n "${REMOTION_BROWSER:-}" ] && BROWSER_ARGS=(--browser-executable="$REMOTION_BROWSER")
npx remotion render src/index.ts "$ID" "$OUT/preview.mp4" --scale=0.4 --concurrency=4 "${BROWSER_ARGS[@]}"
rm -f "$OUT"/sheet_*.png
ffmpeg -v error -i "$OUT/preview.mp4" -vf "fps=2,scale=200:-1,drawtext=text='%{pts\:hms}':x=3:y=3:fontcolor=yellow:fontsize=13:box=1:boxcolor=black@0.6,tile=10x3" "$OUT/sheet_%02d.png"
ls "$OUT"
