#!/bin/bash
echo "Testing Cologne WFS services..."

# Try common NRW/Cologne WFS endpoints
ENDPOINTS=(
  "https://www.wms.nrw.de/geobasis/wfs_nw_verwaltungsgrenzen"
  "https://geodaten.bonn.de/geobasis"
  "https://www.offenedaten-koeln.de"
)

for endpoint in "${ENDPOINTS[@]}"; do
  echo -e "\n--- Testing: $endpoint ---"
  curl -s -I "$endpoint" 2>&1 | head -3
done
