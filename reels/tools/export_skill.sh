#!/usr/bin/env bash
# Build a self-contained, portable copy of the "montage-reels" skill:
#   export/montage-reels.zip      → skills/montage (the /montage command) + skills/montage-reels
#                                   (SKILL.md + references/ + template/ = the engine)
#   export/references-videos.zip  → the reference reels, renamed by family (optional, needs REFS_DIR)
# Usage: tools/export_skill.sh [REFS_DIR]
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
OUT=$ROOT/export
STAGE=$(mktemp -d)
SK=$STAGE/skills/montage-reels
mkdir -p "$SK" "$OUT" "$STAGE/skills/montage"
cp -r "$ROOT/.claude/skills/montage-reels/." "$SK/"
cp -r "$ROOT/.claude/skills/montage/." "$STAGE/skills/montage/"
cp "$ROOT/reels/STYLE.md" "$SK/references/STYLE.md"
mkdir -p "$SK/template"
( cd "$ROOT/reels" && tar cf - --exclude=node_modules --exclude=out --exclude=public/media . ) | ( cd "$SK/template" && tar xf - )
mkdir -p "$SK/template/public/media"
rm -f "$OUT/montage-reels.zip"
( cd "$STAGE/skills" && zip -qr "$OUT/montage-reels.zip" montage montage-reels )

REFS_DIR=${1:-}
if [ -n "$REFS_DIR" ]; then
  R=$STAGE/refs; mkdir -p "$R"
  pick() { f=$(ls "$REFS_DIR"/*"$1"* 2>/dev/null | head -1); [ -n "$f" ] && cp "$f" "$R/$2.mp4" || echo "!! introuvable : $1"; }
  pick a8d5e309352572f4a88803586578f98a motion_a8d5
  pick 96c1fb44a0b2192d3f4218ef4dc583a2 motion_96c1
  pick 6177c7d3efe659dc2662ad78a01654b6 motion_6177
  pick 082a838d996243f99c29812f7bddd955 motion_082a
  pick 2a9c5e135e3f3cc6cdea7b5b22039584 text_2a9c
  pick 0b995a6f883002b85ba1b4341b61c5a7 text_0b99
  pick 7014eed59d5c613b4e3e76b1c7b2bafb text_7014
  pick 0b82f5b775155c6455ccf03cd493d956 subs_0b82
  pick 467e2349cabe9e18cd890db460d0facd subs_467e
  rm -f "$OUT/references-videos.zip"
  ( cd "$STAGE" && zip -qr "$OUT/references-videos.zip" refs )
fi
rm -rf "$STAGE"
ls -la "$OUT"
