#!/bin/bash
#
# Generate PMTiles from processed GeoJSON using tippecanoe
#
# Prerequisites:
#   brew install tippecanoe
#
# Run with: ./scripts/04-generate-tiles.sh

set -e

INPUT="data/processed/lor-with-data.geojson"
OUTPUT="public/data/berlin-lor.pmtiles"

if [ ! -f "$INPUT" ]; then
    echo "Error: Input file not found: $INPUT"
    echo "Run scripts/03-process-data.ts first"
    exit 1
fi

if ! command -v tippecanoe &> /dev/null; then
    echo "Error: tippecanoe not found"
    echo "Install with: brew install tippecanoe"
    exit 1
fi

echo "Generating PMTiles..."

tippecanoe \
    -o "$OUTPUT" \
    -Z 8 \
    -z 14 \
    --layer=planungsraeume \
    --detect-shared-borders \
    --coalesce-densest-as-needed \
    --extend-zooms-if-still-dropping \
    --force \
    "$INPUT"

echo "Generated: $OUTPUT"
ls -lh "$OUTPUT"

