#!/usr/bin/env bash
set -euo pipefail

MJML_SRC="$(dirname "$0")"
OUTPUT="${MJML_SRC}/../src/main/resources/templates/email"

mkdir -p "$OUTPUT"

for f in "$MJML_SRC"/*.mjml; do
  name="$(basename "$f" .mjml)"
  echo "mjml: $name"
  npx --yes mjml "$f" -o "${OUTPUT}/${name}.html"
done

echo "ok templates compilados para ${OUTPUT}"
