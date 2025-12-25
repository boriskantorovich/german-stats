#!/bin/bash
#
# Generate PMTiles from processed GeoJSON using tippecanoe
#
# This script generates a single PMTiles file with multiple layers:
# - planungsraeume: 542 planning areas (LOR)
# - bezirke: 12 districts
#
# Prerequisites:
#   brew install tippecanoe
#
# Run with: ./scripts/04-generate-tiles.sh

set -e

INPUT_PLR="data/processed/lor-with-data.geojson"
INPUT_BEZ="data/processed/bezirke.geojson"
OUTPUT="public/data/berlin-lor.pmtiles"

# Check for Planungsräume input
if [ ! -f "$INPUT_PLR" ]; then
    echo "Error: Planungsräume file not found: $INPUT_PLR"
    echo "Run scripts/03-process-data.ts first"
    exit 1
fi

# Check for Bezirke input
if [ ! -f "$INPUT_BEZ" ]; then
    echo "Error: Bezirke file not found: $INPUT_BEZ"
    echo "Run scripts/06-generate-bezirke.ts first"
    exit 1
fi

# Check for tippecanoe
if ! command -v tippecanoe &> /dev/null; then
    echo "Error: tippecanoe not found"
    echo "Install with: brew install tippecanoe"
    exit 1
fi

echo "Generating PMTiles with multiple layers..."
echo "  - planungsraeume: $INPUT_PLR"
echo "  - bezirke: $INPUT_BEZ"

tippecanoe \
    -o "$OUTPUT" \
    -Z 8 \
    -z 14 \
    --detect-shared-borders \
    --coalesce-densest-as-needed \
    --extend-zooms-if-still-dropping \
    --force \
    --named-layer=planungsraeume:"$INPUT_PLR" \
    --named-layer=bezirke:"$INPUT_BEZ"

echo ""
echo "Generated: $OUTPUT"
ls -lh "$OUTPUT"
echo ""
echo "Layers included:"
echo "  - planungsraeume (542 features)"
echo "  - bezirke (12 features)"
