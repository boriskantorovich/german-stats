# Data Availability for Other German Cities - Summary

**Date**: December 26, 2025  
**Research Status**: Preliminary investigation completed

---

## Executive Summary

**YES**, similar data exists for other major German cities, but with important caveats:

### ✅ **Data IS Available**
- All major cities publish neighborhood-level boundaries (geodata)
- All cities provide population statistics at district level
- Open data portals exist for most cities (CKAN-based or custom)
- Licensing is generally open (CC BY or similar)

### ⚠️ **Key Differences from Berlin**
1. **Granularity**: Berlin's 542 planning areas are uniquely detailed
2. **Standardization**: No common system across cities
3. **Update frequency**: Varies from monthly (Berlin) to annual (others)
4. **Demographic categories**: Age breakdowns differ by city

---

## City-by-City Breakdown

### 🟢 **Hamburg** (HIGH FEASIBILITY)
- **Population**: ~1.9M
- **Units**: 104 Stadtteile (districts)
- **Geodata Portal**: https://transparenz.hamburg.de / https://geoportal-hamburg.de
- **Statistics**: Statistik Nord (https://www.statistik-nord.de)
- **Assessment**: Well-documented open data program, good API access

**Known Data Sources**:
- Stadtteil boundaries available via WFS/download
- Population by Stadtteil published regularly
- Similar data structure to Berlin (though less granular)

### 🟢 **Munich** (HIGH FEASIBILITY)
- **Population**: ~1.5M  
- **Units**: 25 Stadtbezirke (much coarser than Berlin!)
- **Geodata Portal**: https://opendata.muenchen.de / https://geoportal.muenchen.de
- **Statistics**: Statistisches Amt München
- **Assessment**: Strong open data portal, well-maintained

**Note**: Only 25 districts vs Berlin's 542 planning areas - significantly less granular

### 🟡 **Cologne** (MEDIUM-HIGH FEASIBILITY)
- **Population**: ~1.1M
- **Units**: 86 Stadtteile
- **Geodata Portal**: https://www.offenedaten-koeln.de
- **Statistics**: Amt für Stadtentwicklung und Statistik
- **Assessment**: Open data portal exists, needs verification of data structure

### 🟡 **Frankfurt** (MEDIUM-HIGH FEASIBILITY)
- **Population**: ~760K
- **Units**: 46 Stadtteile
- **Geodata Portal**: https://offenedaten.frankfurt.de / https://geoportal.frankfurt.de
- **Statistics**: Bürgeramt, Statistik und Wahlen
- **Assessment**: Open data available, needs data structure verification

### 🟡 **Stuttgart** (MEDIUM FEASIBILITY)
- **Population**: ~630K
- **Units**: 23 Stadtbezirke, 152 Stadtteile
- **Geodata Portal**: Various city portals
- **Statistics**: Statistisches Amt Stuttgart
- **Assessment**: Data exists but less centralized

### 🟡 **Dresden** (MEDIUM FEASIBILITY)
- **Population**: ~560K
- **Units**: 19 Stadtbezirke
- **Geodata Portal**: https://opendata.dresden.de
- **Statistics**: Kommunale Statistikstelle
- **Assessment**: Open data portal exists, mentioned in literature

---

## Technical Comparison

| City | Units | Granularity vs Berlin | Open Data Portal | Ease of Access |
|------|-------|----------------------|------------------|----------------|
| **Berlin** | 542 LOR | 100% (reference) | ✅ Excellent | 🟢 Very Easy |
| **Hamburg** | 104 | 19% | ✅ Good | 🟢 Easy |
| **Cologne** | 86 | 16% | ✅ Good | 🟡 Medium |
| **Munich** | 25 | 5% | ✅ Good | 🟢 Easy |
| **Frankfurt** | 46 | 8% | ✅ Good | 🟡 Medium |
| **Stuttgart** | 23-152 | 4-28% | ⚠️ Partial | 🟡 Medium |
| **Dresden** | 19 | 3% | ✅ Good | 🟡 Medium |

---

## Universal Pipeline Architecture

### ✅ **Recommendation: Config-Based Universal Pipeline**

Instead of custom scripts per city, use a configuration-driven approach:

```
cities/
├── berlin.config.ts       # Berlin-specific config
├── hamburg.config.ts      # Hamburg-specific config
├── munich.config.ts       # Munich-specific config
└── ...

scripts/
├── universal-processor.ts # Reads city config, processes data
├── generate-tiles.ts      # Universal tile generator
└── generate-profiles.ts   # Universal profile generator
```

### Config Schema Example

```typescript
interface CityConfig {
  id: string;
  name: string;
  
  // Geographic data
  geometry: {
    source: 'file' | 'wfs' | 'url';
    url: string;
    format: 'geojson' | 'shapefile' | 'wfs';
    crs: string;              // e.g., "EPSG:25833"
    idField: string;          // e.g., "PLR_ID" or "STADTTEIL_NR"
    nameField: string;
    hierarchyFields?: string[];
  };
  
  // Demographic data
  demographics: {
    source: 'csv' | 'excel' | 'api';
    url: string;
    idField: string;          // join key
    encoding?: string;
    fieldMapping: {
      population: string;
      age_0_14?: string;      // optional if not available
      age_15_64?: string;
      age_65_plus?: string;
      // ... other fields
    };
  };
  
  // Display settings
  display: {
    center: [number, number];
    zoom: number;
    unitName: string;         // "Planungsraum", "Stadtteil", etc.
  };
}
```

### Processing Pipeline

1. **Load city config** → `cities/${city}.config.ts`
2. **Fetch geometry** → Use config to download/read geodata
3. **Convert/reproject** → Standardize to EPSG:4326 (WGS84)
4. **Fetch demographics** → Use config to download stats
5. **Parse & map fields** → Use field mapping from config
6. **Join data** → Match on id fields
7. **Calculate percentiles** → Compute ranks across all areas
8. **Generate tiles** → PMTiles for web display
9. **Generate profiles** → JSON with all area data

### One Command to Rule Them All

```bash
# Process any city
npm run process:city berlin
npm run process:city hamburg
npm run process:city munich

# Process all cities
npm run process:all
```

---

## Next Steps to Implement

### Phase 1: Verify Data Sources (Current Phase)
- [ ] Download sample data from Hamburg
- [ ] Download sample data from Munich
- [ ] Download sample data from Cologne
- [ ] Verify data structures and field names
- [ ] Document exact download URLs

### Phase 2: Create Config Schema
- [ ] Define TypeScript interface for city config
- [ ] Create validation schema
- [ ] Write config for Berlin (reference)
- [ ] Write configs for Hamburg, Munich, Cologne

### Phase 3: Build Universal Processor
- [ ] Refactor existing Berlin scripts to be config-driven
- [ ] Add support for multiple geometry formats
- [ ] Add support for WFS services
- [ ] Add field mapping logic
- [ ] Handle optional indicators gracefully

### Phase 4: Multi-City UI
- [ ] Add city selector to UI
- [ ] Load appropriate tiles/profiles per city
- [ ] Update metadata per city
- [ ] Handle different granularities in visualization

---

## Challenges & Solutions

### Challenge 1: Different Age Group Definitions
**Problem**: Berlin uses 0-14, 15-64, 65+. Other cities may use 0-18, 18-65, 65+.

**Solutions**:
- Make age groups optional in config
- Show "N/A" for unavailable indicators
- Document actual categories per city
- Consider normalization if possible

### Challenge 2: Varying Update Frequencies
**Problem**: Berlin updates monthly, others annually.

**Solutions**:
- Store reference date in metadata
- Show data freshness in UI
- Cache appropriately per city

### Challenge 3: Different Hierarchies
**Problem**: 2-3 levels of nesting, different names.

**Solutions**:
- Make hierarchy fields array in config
- Handle 1-N parent levels flexibly
- Display hierarchy breadcrumbs dynamically

### Challenge 4: WFS vs File Downloads
**Problem**: Some cities only offer WFS services, not direct downloads.

**Solutions**:
- Add WFS client to processor
- Use ogr2ogr for WFS-to-GeoJSON conversion
- Cache downloaded data locally

---

## Estimated Effort

| Task | Time Estimate |
|------|---------------|
| Verify & download data for 3 cities | 1-2 days |
| Create config schema & validation | 0.5 days |
| Refactor to universal pipeline | 2-3 days |
| Create 3-5 city configs | 1 day |
| Multi-city UI | 1-2 days |
| Testing & documentation | 1 day |
| **Total** | **7-10 days** |

---

## Conclusion

### ✅ **FEASIBLE**: Yes, a multi-city expansion is definitely possible

### 🎯 **Best Approach**: Universal config-driven pipeline

### 🚀 **Recommended Priority**:
1. **Hamburg** (similar granularity, strong data)
2. **Cologne** (medium granularity, good data)
3. **Munich** (lower granularity but major city)
4. **Frankfurt** (medium granularity)

### 📊 **Expected Result**:
A single codebase that can visualize neighborhood data for any German city by simply adding a config file.

---

## Resources for Implementation

### German Open Data Aggregators
- **GovData.de**: https://www.govdata.de (national aggregator)
- **Geoportal.de**: https://geoportal.de (geospatial aggregator)

### Tools Needed
- `ogr2ogr` (GDAL) - geometry conversion, CRS reprojection
- `tippecanoe` - PMTiles generation
- `tsx` - TypeScript execution
- `curl`/`wget` - data downloads

### Helpful Libraries
- `@tmcw/togeojson` - convert KML/GPX to GeoJSON
- `shapefile` - read shapefiles in Node.js
- `papaparse` - CSV parsing
- `proj4` - coordinate transformations



