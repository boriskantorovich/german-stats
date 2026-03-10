# Other German Cities - Data Source Research

Research conducted: December 26, 2025

## Goal
Find neighborhood-level geodata and demographics for major German cities, comparable to Berlin's LOR system.

---

## Hamburg (Population: ~1.9M, 104 Stadtteile)

### Geography
- **Administrative Units**: 7 Bezirke (districts), 104 Stadtteile (neighborhoods)
- **Data Source**: Geoportal Hamburg / Transparenz Portal
- **Potential URLs**:
  - Geoportal: https://geoportal-hamburg.de
  - Transparency Portal: https://transparenz.hamburg.de
  - WFS Service: https://geodienste.hamburg.de (likely endpoint)
  
### Demographics
- **Provider**: Statistikamt Nord (Statistisches Amt für Hamburg und Schleswig-Holstein)
- **Website**: https://www.statistik-nord.de
- **Granularity**: Stadtteil-level (104 areas)
- **Data**: Population by age groups, updated regularly

### Status
- 🔍 **Need to find**: Direct download links for Stadtteil boundaries (GeoJSON/Shapefile)
- 🔍 **Need to find**: Population CSV/Excel with Stadtteil-level breakdown
- **Estimated availability**: HIGH (Hamburg has strong open data program)

---

## Munich (Population: ~1.5M, 25 Stadtbezirke, ~475 Stadtbezirksteile)

### Geography
- **Administrative Units**: 25 Stadtbezirke (city districts), subdivided into ~475 Stadtbezirksteile
- **Data Source**: Open Data München
- **Potential URLs**:
  - Open Data Portal: https://opendata.muenchen.de
  - Geoportal: https://geoportal.muenchen.de
  
### Demographics
- **Provider**: Statistisches Amt München
- **Website**: https://www.muenchen.de/rathaus/verwaltung/direktorium/statistisches-amt.html
- **Granularity**: Stadtbezirk level (25 areas) - less granular than Berlin
- **Data**: Population by age, updated annually

### Status
- 🔍 **Need to find**: Stadtbezirk boundaries download
- 🔍 **Need to find**: Population statistics by Stadtbezirk
- **Estimated availability**: HIGH (Munich has open data portal)
- **Note**: Much less granular than Berlin (25 vs 542 areas)

---

## Cologne (Köln) (Population: ~1.1M, 86 Stadtteile)

### Geography
- **Administrative Units**: 9 Stadtbezirke, 86 Stadtteile (neighborhoods)
- **Data Source**: Offene Daten Köln
- **Potential URLs**:
  - Open Data Portal: https://offenedaten-koeln.de
  - Geoportal: https://www.offenedaten-koeln.de/dataset/stadtteile-koeln
  
### Demographics
- **Provider**: Amt für Stadtentwicklung und Statistik
- **Granularity**: Stadtteil level (86 areas)
- **Data**: Population, demographics

### Status
- 🔍 **Need to find**: Download links verified
- **Estimated availability**: MEDIUM-HIGH

---

## Frankfurt am Main (Population: ~760K, 46 Stadtteile)

### Geography
- **Administrative Units**: 16 Ortsbezirke, 46 Stadtteile
- **Data Source**: Offene Daten Frankfurt
- **Potential URLs**:
  - Open Data Portal: https://offenedaten.frankfurt.de
  - Geoportal: https://geoportal.frankfurt.de
  
### Demographics
- **Provider**: Bürgeramt, Statistik und Wahlen
- **Granularity**: Stadtteil level (46 areas)

### Status
- 🔍 **Need to find**: Download links verified
- **Estimated availability**: MEDIUM-HIGH

---

## Stuttgart (Population: ~630K, 23 Stadtbezirke, 152 Stadtteile)

### Geography
- **Administrative Units**: 23 Stadtbezirke, 152 Stadtteile
- **Data Source**: Stadtmessungsamt Stuttgart
- **Potential URLs**:
  - https://www.stuttgart.de/leben/statistik
  
### Demographics
- **Provider**: Statistisches Amt Stuttgart
- **Granularity**: Stadtbezirk/Stadtteil level

### Status
- 🔍 **Need to research**: Data availability
- **Estimated availability**: MEDIUM

---

## Dresden (Population: ~560K, 10 Ortsamtsbereiche, 19 Stadtbezirke)

### Geography
- **Administrative Units**: 10 Ortsamtsbereiche, 19 Stadtbezirke
- **Data Source**: Open Data Dresden
- **Potential URLs**:
  - https://opendata.dresden.de
  
### Demographics
- **Provider**: Landeshauptstadt Dresden, Kommunale Statistikstelle

### Status
- 🔍 **Need to research**: Data availability
- **Estimated availability**: MEDIUM-HIGH (Dresden mentioned in open data literature)

---

## Key Findings

### What's Consistent Across Cities:
1. ✅ All major cities have district-level administrative boundaries
2. ✅ All major cities publish population statistics
3. ✅ Most have open data portals (though quality varies)
4. ✅ Geographic data typically available in Shapefile or GeoJSON

### Key Differences from Berlin:
1. ⚠️ **Granularity varies widely**: 25 (Munich) to 542 (Berlin) areas
2. ⚠️ **No standardized system**: Each city has own boundary definitions
3. ⚠️ **Different hierarchies**: 2-3 levels of nesting vary by city
4. ⚠️ **Update frequencies differ**: Monthly (Berlin) to annually (others)
5. ⚠️ **Data formats differ**: Field names, structure, indicators vary

### Universal Pipeline Feasibility: ✅ HIGH

A config-based approach can handle these differences:
- Config file per city defines fields, URLs, hierarchies
- Universal processor handles geometry + demographics join
- City-specific field mapping in config
- Optional indicators (show "N/A" if not available)

---

## Next Steps

1. **Verify actual download URLs** for each city
2. **Download sample datasets** to verify structure
3. **Create city config schema** defining required fields
4. **Build universal data processor** with city configs
5. **Generate tiles and profiles** for each city

---

## Technical Notes

### Coordinate Reference Systems
- Berlin uses: EPSG:25833 (ETRS89 UTM 33N) → convert to EPSG:4326 (WGS84)
- Hamburg likely uses: EPSG:25832 (UTM 32N)
- Need to handle CRS conversion in pipeline

### File Formats Encountered
- Shapefiles (.shp + supporting files)
- GeoJSON
- WFS (Web Feature Service) - need to query and download
- CSV/Excel for demographics

### Required Tools
- `ogr2ogr` (GDAL) - convert Shapefiles, reproject CRS
- `tippecanoe` - generate PMTiles
- `jq` - process JSON
- Node.js/TypeScript - data processing scripts


