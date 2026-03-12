# Berlin LOR Data Sources

## Current Status (Dec 24, 2025)

### ✅ Working Sources

| Data Type | Source | URL | Status | Notes |
|-----------|--------|-----|--------|-------|
| **LOR 2021 Geometry** | Berlin.de | `https://www.berlin.de/sen/sbw/_assets/stadtdaten/stadtwissen/lebensweltlich-orientierte-raeume/lor_2021-01-01_k3_shapefiles_nur_id.7z` | ✅ 200 OK | **542 Planungsräume** (Shapefile, requires conversion) |
| **Demographics CSV** | Amt für Statistik | `https://www.statistik-berlin-brandenburg.de/opendata/EWR_L21_202412E_Matrix.csv` | ✅ 200 OK | December 2024 data (matches LOR 2021) |

## Important Notes

### LOR 2021 System

Berlin uses **LOR 2021** boundaries (effective since January 1, 2021):

- **542 Planungsräume** (planning areas)
- **143 Bezirksregionen** (district regions)  
- **58 Prognoseräume** (forecast areas)

The geometry is only available as **Shapefile** format, which requires conversion to GeoJSON for web use.

## Setup Instructions

### Download & Convert LOR 2021 Geometry

1. **Install required tools:**
   ```bash
   # macOS
   brew install p7zip gdal
   
   # Ubuntu/Debian
   sudo apt install p7zip-full gdal-bin
   ```

2. **Download Shapefile:**
   ```bash
   curl -O "https://www.berlin.de/sen/sbw/_assets/stadtdaten/stadtwissen/lebensweltlich-orientierte-raeume/lor_2021-01-01_k3_shapefiles_nur_id.7z"
   ```

3. **Extract archive:**
   ```bash
   7z x lor_2021-01-01_k3_shapefiles_nur_id.7z
   ```

4. **Convert to GeoJSON:**
   ```bash
   ogr2ogr -f GeoJSON -t_srs EPSG:4326 \
     data/raw/lor-planungsraeume.geojson \
     lor_planungsraeume_2021.shp
   ```

5. **Run data pipeline:**
   ```bash
   npx tsx scripts/01-fetch-geometry.ts  # Will verify file exists
   npx tsx scripts/02-fetch-demographics.ts
   npx tsx scripts/03-process-data.ts
   npx tsx scripts/04-generate-tiles.sh
   ```

## Data Attribution

### LOR Geometry
- **Source**: Senatsverwaltung für Stadtentwicklung und Umwelt Berlin
- **License**: CC BY 3.0 DE
- **Attribution**: "Amt für Statistik Berlin-Brandenburg"

### Demographics
- **Source**: Amt für Statistik Berlin-Brandenburg
- **License**: CC BY
- **URL**: https://www.statistik-berlin-brandenburg.de
- **Reference Date**: December 31, 2024

## Additional Resources

- **Official LOR Portal**: https://www.berlin.de/sen/sbw/stadtdaten/stadtwissen/sozialraumorientierte-planungsgrundlagen/lebensweltlich-orientierte-raeume/
- **Amt für Statistik**: https://www.statistik-berlin-brandenburg.de
- **Demographics as Linked Open Data**: https://github.com/berlinonline/lod-berlin-einwohner

