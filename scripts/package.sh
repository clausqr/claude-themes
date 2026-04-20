#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

VERSION=$(node -p "require('./extension/manifest.json').version")
OUT="claude-themes-chrome-${VERSION}.zip"

rm -f "$OUT"
(cd extension && zip -qr "../${OUT}" . \
  -x "*.DS_Store" "*/.git/*")

SIZE=$(du -h "$OUT" | cut -f1)
FILES=$(unzip -l "$OUT" | tail -1 | awk '{print $2}')
echo "-> ${OUT}  (${SIZE}, ${FILES} files)"
echo "   Upload to Chrome Web Store AND Firefox AMO — same artifact."
