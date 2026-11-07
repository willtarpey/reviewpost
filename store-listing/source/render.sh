#!/bin/bash
# Renders each mockup page to a PNG at the exact Chrome Web Store size.
# Needs the "store-listing" server running on port 8766 (serves the session folder).
cd "$(dirname "$0")"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PROFILE="${TMPDIR:-/tmp}/reviewpost-render-profile"
render() { # name width height
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --user-data-dir="$PROFILE" --window-size="$2,$3" --virtual-time-budget=10000 \
    --screenshot="../images/$1.png" "http://localhost:8766/store-listing/source/$1.html" 2>/dev/null
  echo "rendered $1 ($2×$3)"
}
for n in screenshot-1-hero screenshot-2-editor screenshot-3-review-button screenshot-4-designs screenshot-5-brand; do render "$n" 1280 800; done
render promo-small 440 280
render promo-marquee 1400 560
