#!/usr/bin/env bash
# One-time setup of the montage engine (Node 18+, ffmpeg, Python 3 required).
set -euo pipefail
cd "$(dirname "$0")/.."
npm install --no-audit --no-fund
python3 -m pip install --quiet opencv-python-headless numpy pillow
mkdir -p public/media out
command -v ffmpeg >/dev/null || echo "!! ffmpeg manquant : l'installer (brew install ffmpeg / apt install ffmpeg)"
echo "OK. Prévisualiser : npx remotion studio src/index.ts"
