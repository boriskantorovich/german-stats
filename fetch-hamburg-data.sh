#!/bin/bash
# Attempt to fetch Hamburg population data from various sources

echo "Attempting to fetch Hamburg population data..."

# Try Hamburg transparency portal API
echo "1. Checking Hamburg Transparency Portal..."
curl -s "https://suche.transparenz.hamburg.de/api/3/action/package_search?q=bevölkerung+stadtteile" 2>&1 | head -100

echo -e "\n2. Checking for direct CSV links..."
# Common patterns for German statistical data
PATTERNS=(
  "https://www.statistik-nord.de/fileadmin/Dokumente/NORD.regional/HH_A_I_Bevoelkerungsstand"
  "https://www.statistik-nord.de/fileadmin/Dokumente/Statistische_Berichte/bevoelkerung"
)

for pattern in "${PATTERNS[@]}"; do
  echo "Trying: $pattern"
  curl -I "$pattern" 2>&1 | head -5
done

