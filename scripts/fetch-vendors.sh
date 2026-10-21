#!/usr/bin/env bash
set -euo pipefail

# fetch-vendors.sh
# Utility to download and refresh local offline vendor packages and font files

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENDOR_DIR="$DIR/vendor"
FONTS_DIR="$VENDOR_DIR/fonts"

mkdir -p "$VENDOR_DIR" "$FONTS_DIR"

echo "Fetching core vendor libraries..."
curl -fsSL "https://cdn.jsdelivr.net/npm/marked@12.0.1/lib/marked.esm.js" -o "$VENDOR_DIR/marked.esm.js"
curl -fsSL "https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.mjs" -o "$VENDOR_DIR/js-yaml.esm.js"
curl -fsSL "https://cdn.jsdelivr.net/npm/dompurify@3.1.0/dist/purify.es.mjs" -o "$VENDOR_DIR/purify.es.js"
curl -fsSL "https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.mjs" -o "$VENDOR_DIR/docx.esm.js"
curl -fsSL "https://cdn.jsdelivr.net/npm/pagedjs@0.4.3/dist/paged.polyfill.js" -o "$VENDOR_DIR/paged.polyfill.js"
curl -fsSL "https://cdn.jsdelivr.net/npm/idb-keyval@6.2.1/dist/index.js" -o "$VENDOR_DIR/idb-keyval.js"

echo "Vendors successfully fetched to $VENDOR_DIR"
