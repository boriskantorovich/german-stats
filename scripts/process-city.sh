#!/bin/bash
#
# Process city data using universal processor
# Usage: ./scripts/process-city.sh <city-id>
#

set -e

CITY_ID=$1

if [ -z "$CITY_ID" ]; then
  echo "Usage: ./scripts/process-city.sh <city-id>"
  echo "Available cities: berlin, hamburg, munich"
  exit 1
fi

echo "Processing $CITY_ID..."

# 1. Process data
npx tsx scripts/universal-process.ts "$CITY_ID"

# 2. Generate tiles (if geojson with data exists)
INPUT_FILE="data/processed/$CITY_ID/${CITY_ID}-with-data.geojson"

if [ -f "$INPUT_FILE" ]; then
  echo ""
  echo "Generating PMTiles..."
  
  tippecanoe \
    -o "public/data/$CITY_ID/${CITY_ID}.pmtiles" \
    -Z 8 -z 14 \
    --layer="areas" \
    --detect-shared-borders \
    --coalesce-densest-as-needed \
    --extend-zooms-if-still-dropping \
    --force \
    "$INPUT_FILE"
    
  echo "✅ PMTiles generated: public/data/$CITY_ID/${CITY_ID}.pmtiles"
else
  echo "⚠️  No processed data file found, skipping tile generation"
fi

echo ""
echo "✅ Processing complete for $CITY_ID"


