#!/bin/bash
# Test Munich geodata sources

echo "Testing Munich geoportal WFS..."
curl -s "https://geoportal.muenchen.de/geoserver/gsm/wfs?SERVICE=WFS&REQUEST=GetCapabilities" 2>&1 | grep -i "stadtbezirk" | head -5

echo -e "\n\nTrying alternative WFS..."
curl -s -I "https://geoportal.muenchen.de/geoserver/wfs" 2>&1 | head -5
