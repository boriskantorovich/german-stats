#!/bin/bash
# Test Hamburg WFS service for district boundaries
# Common WFS endpoint patterns for Hamburg

WFS_BASE="https://geodienste.hamburg.de/HH_WFS_Verwaltungsgrenzen"

echo "Testing Hamburg WFS GetCapabilities..."
curl -s "${WFS_BASE}?SERVICE=WFS&REQUEST=GetCapabilities" | grep -i "stadtteil" | head -5

echo -e "\n\nTrying alternative endpoint..."
curl -s "https://geodienste.hamburg.de" -I | head -5
