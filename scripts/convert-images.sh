#!/usr/bin/env bash
set -euo pipefail

IMAGES_DIR="../images"
OUTPUT_DIR="../images/compressed"
QUALITY=80

# Check for cwebp
if ! command -v cwebp &>/dev/null; then
  echo "cwebp not found. Installing webp package..."
  sudo apt-get update -qq && sudo apt-get install -y -qq webp
fi

mkdir -p "$OUTPUT_DIR"

count=0
for file in "$IMAGES_DIR"/*.png; do
  [ -f "$file" ] || continue
  name="$(basename "$file" .png)"
  output="$OUTPUT_DIR/${name}.webp"
  echo "Converting: $file -> $output"
  cwebp -q "$QUALITY" "$file" -o "$output"
  count=$((count + 1))
done

echo "Done. Converted $count image(s)."
