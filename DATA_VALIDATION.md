# Data Validation Report

**Generated:** 2024-12-25  
**Data Source:** Berlin Open Data - December 2024

## ✅ Data Integrity Verified

### Population Data
- **Total Areas:** 542 Planungsräume (LOR 2021)
- **Total Population:** 3,897,145 people
- **Median Density:** 8,966 people/km²

### Age Distribution (Berlin-wide)
| Age Group | Population | Percentage |
|-----------|------------|------------|
| 0-14 years (Children/Youth) | 531,414 | 13.6% |
| 15-64 years (Working Age) | 2,627,493 | 67.4% |
| 65+ years (Retirement Age) | 738,238 | 18.9% |
| **Total** | **3,897,145** | **100.0%** ✅ |

**Validation:** Age groups sum exactly to total population ✓

## Data Structure

### Source Files

#### 1. Geometry (`data/raw/lor-planungsraeume.geojson`)
- **Source:** Berlin.de Shapefile (converted to GeoJSON)
- **Features:** 542 polygons
- **Properties:** Only `PLR_ID` (8-digit code)
- **Note:** Names are NOT included in the geometry data

#### 2. Demographics (`data/raw/population-2024.csv`)
- **Source:** Amt für Statistik Berlin-Brandenburg
- **Date:** December 31, 2024
- **Rows:** 542 (one per Planungsraum)
- **Key Columns:**
  - `BEZ`, `PGR`, `BZR`, `PLR` - ID components (combined = 8-digit PLR_ID)
  - `E_E` - Total population
  - `E_EU1`, `E_E1U6`, `E_E6U15` - Age groups 0-14
  - `E_E15U18`, `E_E18U25`, `E_E25U55`, `E_E55U65` - Age groups 15-64
  - `E_E65U80`, `E_E80U110` - Age groups 65+

### PLR_ID Structure

The 8-digit `PLR_ID` is composed of:
```
01 10 01 01
│  │  │  └─ PLR: Planungsraum (2 digits)
│  │  └──── BZR: Bezirksregion (2 digits)
│  └─────── PGR: Prognoseraum (2 digits)
└────────── BEZ: Bezirk (2 digits)
```

Example: `01100101` = Bezirk 01, Prognoseraum 10, Bezirksregion 01, Planungsraum 01

## Known Limitations

### Data Limitations
The current data sources only provide:
- ✅ **PLR_ID:** 8-digit identifier (format: BEZ + PGR + BZR + PLR)
- ✅ **Population metrics:** Total and age groups
- ✅ **Geography:** Area boundaries (geometry)

**Not available in source data:**
- ❌ Area names (Planungsraum names)
- ❌ District names (Bezirk, Bezirksregion, Prognoseraum)
- ❌ Other identifiers beyond PLR_ID

**Design decision:** We removed all non-existent fields from the data models. The types now contain only fields that actually exist in the data sources.

## Data Processing Pipeline

1. **Download** → LOR 2021 Shapefile (805 KB)
2. **Convert** → GeoJSON with `ogr2ogr` (8.4 MB)
3. **Download** → Demographics CSV (107 KB)
4. **Process** → Join geometry + demographics by PLR_ID
5. **Calculate** → Density, percentages, percentiles
6. **Generate** → PMTiles for map rendering (906 KB)
7. **Export** → Profiles JSON for app (313 KB)

## Sample Data

### Area: 10100101
- **Population:** 5,837
- **Density:** 8,512 people/km²
- **Area:** 0.69 km²
- **Age Distribution:**
  - 0-14: 936 (16.0%)
  - 15-64: 3,914 (67.1%)
  - 65+: 987 (16.9%)

### Area: 10100102
- **Population:** 3,680
- **Density:** 11,385 people/km²
- **Area:** 0.32 km²
- **Age Distribution:**
  - 0-14: 606 (16.5%)
  - 15-64: 2,416 (65.7%)
  - 65+: 658 (17.9%)

## Validation Checks

✅ All 542 areas have matching geometry and demographics  
✅ Age groups sum to total population for all areas  
✅ No negative values in any field  
✅ Density calculations are reasonable (0 - 50,000 /km²)  
✅ Percentiles calculated correctly (0-100 range)  
✅ Berlin total matches sum of all areas  

## TypeScript Type Accuracy

The types in `src/types/index.ts` have been updated to accurately reflect:
- ✅ `LORArea` - Documented that names are empty in current data
- ✅ `ProcessedArea` - Removed non-existent detailed age group fields
- ✅ Age groups match CSV structure (0-14, 15-64, 65+)
- ✅ All computed fields are documented with their formulas

## Conclusion

**The data models correctly represent the real data from Berlin Open Data sources.**

All demographic values are accurate and validated. The only limitation is the absence of human-readable names, which is a limitation of the source data, not our processing.

