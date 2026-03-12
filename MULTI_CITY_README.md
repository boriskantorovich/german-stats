# Multi-City Neighborhood Atlas

**A universal, config-driven platform for visualizing neighborhood-level data across German cities**

🗺️ **Live**: [Your deployment URL]  
📊 **Cities**: Berlin (542 areas), Hamburg (104 areas), Munich (25 areas)  
🔧 **Add your city**: Just create a config file!

---

## Quick Start

```bash
# Install dependencies
npm install

# Process a city (requires data in data/raw/<city>/)
./scripts/process-city.sh berlin

# Start dev server
npm run dev
```

---

## Adding a New City

### 1. Create City Config

```typescript
// cities/yourcity.config.ts
import type { CityConfig } from './types'

export const yourCityConfig: CityConfig = {
  id: 'yourcity',
  name: 'Your City',
  
  geometry: {
    source: 'wfs',  // or 'file' or 'url'
    url: 'https://geodata-service.com/wfs...',
    format: 'gml',  // or 'geojson' or 'shapefile'
    idField: 'district_id',  // Field with unique ID
    nameField: 'district_name',
    hierarchyFields: ['parent_name'],  // Optional
  },
  
  demographics: {
    source: 'csv',
    file: 'data/raw/yourcity/demographics.csv',
    idField: 'district_id',  // Must match geometry.idField
    delimiter: ';',
    fieldMapping: {
      population: 'Einwohner',  // Map to YOUR CSV column names
      age_0_14: 'Alter_0_14',
      age_15_64: 'Alter_15_64',
      age_65_plus: 'Alter_65_plus',
      // ... more fields (see types.ts for all options)
    },
  },
  
  display: {
    center: [10.0, 50.0],  // [lng, lat]
    zoom: 10,
    unitName: 'District',
    unitNamePlural: 'Districts',
  },
  
  metadata: {
    population: 1000000,
    areaKm2: 500,
    districts: 50,
    lastUpdate: '2024',
    dataProvider: 'City Statistical Office',
    license: 'CC BY',
    sourceUrl: 'https://data.yourcity.gov',
  },
}
```

### 2. Register City

```typescript
// cities/index.ts
import { yourCityConfig } from './yourcity.config'

export const CITIES: Record<string, CityConfig> = {
  berlin: berlinConfig,
  hamburg: hamburgConfig,
  yourcity: yourCityConfig,  // Add here
}
```

### 3. Add to UI

```typescript
// src/store/appStore.ts
export type CityId = 'berlin' | 'hamburg' | 'yourcity'  // Add here

// src/components/Controls/CitySelector.tsx
const CITIES = {
  yourcity: {
    id: 'yourcity' as CityId,
    name: 'Your City',
    icon: '🏙️',
    population: '1.0M',
    districts: 50,
  },
}
```

### 4. Get Data & Process

```bash
# Place your data files
# - Geometry: Auto-downloads from WFS, or place in data/raw/yourcity/
# - Demographics: data/raw/yourcity/demographics.csv

# Process
./scripts/process-city.sh yourcity

# Output:
# - data/processed/yourcity/yourcity-with-data.geojson
# - public/data/yourcity/profiles/index.json
# - public/data/yourcity/yourcity.pmtiles
```

### 5. Done! 🎉

Your city now appears in the selector with full functionality.

---

## Available Cities

### ✅ Berlin (Complete)
- **Areas**: 542 Planungsräume (LOR 2021)
- **Geodata**: ✅ Ready
- **Demographics**: ✅ Ready
- **Tiles**: ✅ Generated

### 🟡 Hamburg (Geodata Ready)
- **Areas**: 104 Stadtteile
- **Geodata**: ✅ Downloaded (5.6 MB, 104 districts)
- **Demographics**: 🔍 Need to find CSV
- **Tiles**: ⏳ Pending demographics

### 🔴 Munich (Template)
- **Areas**: 25 Stadtbezirke
- **Geodata**: ⏳ Need WFS/download link
- **Demographics**: ⏳ Need CSV
- **Status**: Config template created

---

## Data Sources

### Where to Find City Data

**Geodata (District Boundaries)**:
- City geoportals: `geoportal.<city>.de`
- WFS services: Look for "Verwaltungsgrenzen" or "Stadtteile"
- Open data portals: `opendata.<city>.de`
- Federal geoportal: https://geoportal.de

**Demographics (Population Statistics)**:
- City statistical offices: `statistik.<city>.de`
- Open data portals
- Regional statistical offices (e.g., Statistik Nord for Hamburg)

**Data Requirements**:
- ✅ Geometric boundaries (GeoJSON, Shapefile, or WFS)
- ✅ Population data per district (CSV or Excel)
- ✅ Unique ID field to join geometry with demographics
- ⚠️ Age group breakdowns (optional but recommended)

---

## Architecture

### Config-Driven Processing

```
City Config → Universal Processor → Standardized Output
     ↓                ↓                      ↓
   URLs         Fetch & Convert         GeoJSON
  Fields         Map Fields              PMTiles
 Metadata       Calculate Stats          Profiles
```

**One Processor, Any City**:
- No code changes needed to add cities
- Automatic format conversion (GML, Shapefile → GeoJSON)
- Automatic CRS reprojection (→ WGS84)
- Field mapping via config
- Consistent output structure

### Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **Maps**: MapLibre GL JS + PMTiles
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Data Processing**: Node.js + GDAL + Tippecanoe

---

## Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Data Processing
npx tsx scripts/universal-process.ts <city>  # Process data only
./scripts/process-city.sh <city>             # Full pipeline (data + tiles)

# Check data
ls -lh data/raw/<city>/         # Raw data
ls -lh data/processed/<city>/   # Processed GeoJSON
ls -lh public/data/<city>/      # Tiles & profiles

# List available cities
ls cities/*.config.ts
```

---

## Project Structure

```
cities/
├── types.ts              # Config interfaces
├── berlin.config.ts      # Berlin config (complete)
├── hamburg.config.ts     # Hamburg config (geodata ready)
├── munich.config.ts      # Munich config (template)
└── index.ts              # City registry

scripts/
├── universal-process.ts  # Universal data processor
├── process-city.sh       # Full pipeline script
└── lib/                  # Shared utilities

src/
├── components/
│   ├── Controls/
│   │   └── CitySelector.tsx  # City switcher UI
│   ├── Map/              # Map components
│   └── AreaCard/         # Area detail cards
├── store/
│   └── appStore.ts       # Global state (with cityId)
└── hooks/                # Custom hooks

data/
├── raw/<city>/           # Downloaded/source data
└── processed/<city>/     # Processed GeoJSON

public/data/<city>/
├── profiles/
│   └── index.json        # Area profiles + stats
└── <city>.pmtiles        # Vector tiles
```

---

## Contributing

Want to add your city? We'd love to include it!

1. Find your city's geodata & demographics
2. Create a config file (see template above)
3. Process the data
4. Submit a PR with the config file
5. (Optional) Host the processed data

**Note**: To keep the repo size manageable, we typically don't commit raw data files. Include instructions on where to download them instead.

---

## License

- **Code**: MIT
- **Berlin Data**: CC BY 3.0 DE (Amt für Statistik Berlin-Brandenburg)
- **Hamburg Data**: Open Data (Statistikamt Nord)
- See individual city configs for data attributions

---

## Acknowledgments

- Berlin: Amt für Statistik Berlin-Brandenburg
- Hamburg: Statistikamt Nord, Geoportal Hamburg
- Basemap: Stadia Maps / CARTO
- Built with MapLibre GL JS & PMTiles

---

## FAQ

**Q: How long does it take to add a new city?**  
A: ~1 hour if data is readily available (30 min to find data, 30 min to create config & process)

**Q: What if my city uses different age groups?**  
A: Use the simplified mappings (age_0_14, age_15_64, age_65_plus) or map to available fields. Missing fields show as "N/A".

**Q: Can I add non-German cities?**  
A: Absolutely! The system is language-agnostic. Just adjust field mappings and metadata.

**Q: Do I need to host my own tiles?**  
A: You can! Or use the provided tiles. PMTiles are efficient and can be hosted on static CDN.

**Q: What if my city only has Shapefiles?**  
A: No problem! The processor auto-converts Shapefiles to GeoJSON using ogr2ogr.

---

**Ready to add your city?** See `MULTI_CITY_COMPLETE.md` for detailed implementation guide!


