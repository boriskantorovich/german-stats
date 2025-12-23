# Berlin Neighbourhood Atlas – Implementation Plan

## Overview

A premium, map-first neighbourhood atlas for Berlin using LOR Planungsräume as the spatial unit. Users can explore, understand, compare, and share neighbourhood data through an interactive choropleth map with rich area cards.

---

## Phase 0: Project Setup (Day 1)

### 0.1 Initialize Project
- [ ] Create Vite + React + TypeScript project
- [ ] Configure ESLint, Prettier, and TypeScript strict mode
- [ ] Set up folder structure (see Architecture below)
- [ ] Initialize git repository with `.gitignore`

### 0.2 Dependencies
```json
{
  "dependencies": {
    "react": "^18.3.x",
    "react-dom": "^18.3.x",
    "maplibre-gl": "^4.x",
    "react-map-gl": "^7.x",
    "pmtiles": "^3.x",
    "@tanstack/react-query": "^5.x",
    "zustand": "^5.x",
    "clsx": "^2.x",
    "tailwindcss": "^3.4.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "vite": "^5.x",
    "@types/react": "^18.x",
    "autoprefixer": "^10.x",
    "postcss": "^8.x"
  }
}
```

### 0.3 Environment Variables
```env
VITE_STADIA_API_KEY=your_stadia_api_key
```

> **What is the Stadia Map Style URL?**
> 
> `https://tiles.stadiamaps.com/styles/alidade_smooth.json?api_key=YOUR_KEY`
> 
> This is a **MapLibre Style Specification JSON** file that tells MapLibre GL JS how to render 
> the map: which tile sources to use, what colors for roads/water/buildings, label fonts, etc.
> Stadia hosts pre-built styles like "Alidade Smooth" (muted, clean) or "Alidade Satellite".
> MapLibre fetches this JSON and uses it to draw the basemap. You append your API key to authenticate.

### 0.4 Folder Structure
```
src/
├── components/
│   ├── Map/
│   │   ├── MapContainer.tsx       # Main map wrapper
│   │   ├── LORLayer.tsx           # Choropleth layer
│   │   ├── Legend.tsx             # Dynamic legend
│   │   ├── Tooltip.tsx            # Hover tooltip
│   │   └── LayerSwitcher.tsx      # Layer toggle UI
│   ├── AreaCard/
│   │   ├── AreaCard.tsx           # Main card component
│   │   ├── StatBlock.tsx          # Individual metric display
│   │   ├── PercentileBar.tsx      # Percentile visualization
│   │   ├── ComparisonTable.tsx    # Area vs Berlin median
│   │   └── SourcesBlock.tsx       # Metadata & attribution
│   ├── Search/
│   │   └── SearchBox.tsx          # Address search
│   ├── Controls/
│   │   └── ShareButton.tsx        # Copy URL to clipboard
│   └── Layout/
│       ├── AppShell.tsx           # Main layout
│       └── MobileSheet.tsx        # Bottom sheet for mobile
├── hooks/
│   ├── useMapState.ts             # URL sync & map state
│   ├── useAreaData.ts             # Fetch area profile
│   └── useLayerConfig.ts          # Current layer settings
├── store/
│   └── appStore.ts                # Zustand global state
├── data/
│   ├── layers.ts                  # Layer definitions
│   └── metadata.ts                # Indicator metadata
├── lib/
│   ├── colors.ts                  # Color scales
│   ├── stats.ts                   # Percentile calculations
│   └── url.ts                     # URL state encoding
├── types/
│   └── index.ts                   # TypeScript types
├── styles/
│   └── globals.css                # Tailwind + custom CSS
├── App.tsx
└── main.tsx

public/
├── data/
│   ├── berlin-lor.pmtiles         # Vector tiles
│   └── profiles/                  # Area JSON profiles
│       └── index.json             # All profiles combined
└── favicon.svg
```

---

## Phase 1: Data Pipeline

### 1.1 Data Sources 

| Dataset | Catalog Page | Direct Download | Key Field |
|---------|--------------|-----------------|-----------|
| **LOR Geometry (2021)** | [Catalog](https://daten.berlin.de/datensaetze/lebensweltlich-orientierte-raume-lor-01-01-2021-wfs-34c86848) | WFS API (see below) | `PLR_ID` |
| **Population by Age (2024)** | [Catalog](https://daten.berlin.de/datensaetze/einwohnerinnen-und-einwohner-in-berlin-in-lor-planungsraumen-am-31-12-2024) | [CSV Download](https://www.statistik-berlin-brandenburg.de/opendata/EWR_L21_202412E_Matrix.csv) | `PLR_ID` |

**LOR Geometry Details:**
- **WFS Endpoint**: `https://gdi.berlin.de/services/wfs/lor_2021`
- **GetCapabilities**: `https://gdi.berlin.de/services/wfs/lor_2021?request=GetCapabilities&service=WFS`
- **Reference date**: 01.01.2021
- **Contains**: 58 Prognoseräume, 143 Bezirksregionen, **542 Planungsräume**
- **License**: CC BY 3.0 DE
- **Source**: Amt für Statistik Berlin-Brandenburg

**Population Data Details:**
- **CSV URL**: `https://www.statistik-berlin-brandenburg.de/opendata/EWR_L21_202412E_Matrix.csv`
- **Metadata PDF**: `https://www.statistik-berlin-brandenburg.de/opendata/Beschreibung_EWR_Datenpool_202311.pdf`
- **Reference date**: 31.12.2024
- **License**: CC BY
- **Source**: Amt für Statistik Berlin-Brandenburg

### 1.2 Pipeline Scripts

Create `scripts/` folder at project root:

```
scripts/
├── 01-fetch-geometry.ts      # Download LOR GeoJSON from WFS
├── 02-fetch-demographics.ts  # Download population CSV
├── 03-process-data.ts        # Join, compute derived values
├── 04-generate-tiles.sh      # tippecanoe → PMTiles
├── 05-generate-profiles.ts   # Create area_profiles JSON
└── lib/
    ├── wfs-client.ts
    └── csv-parser.ts
```

Run scripts with: `npx tsx scripts/01-fetch-geometry.ts`

### 1.3 Data Processing Steps

1. **Fetch LOR Geometry**
   ```bash
   # WFS endpoint for LOR 2021 
   # Available layers:
   #   - lor_2021:a_lor_plr_2021  (Planungsräume, 542 areas)
   #   - lor_2021:b_lor_bzr_2021  (Bezirksregionen, 143 areas)
   #   - lor_2021:c_lor_pgr_2021  (Prognoseräume, 58 areas)
   
   # Get Planungsräume as GeoJSON (542 areas - finest granularity)
   curl "https://gdi.berlin.de/services/wfs/lor_2021?\
   service=WFS&version=2.0.0&request=GetFeature&\
   typeNames=lor_2021:a_lor_plr_2021&\
   outputFormat=application/json&\
   srsName=EPSG:4326" \
   -o data/raw/lor-planungsraeume.geojson
   ```

2. **Fetch Demographics**
   - Download CSV from Berlin Open Data
   - Parse and validate against LOR IDs

3. **Join & Compute**
   ```typescript
   interface ProcessedArea {
     PLR_ID: string;
     PLR_NAME: string;
     BZR_NAME: string;        // Bezirksregion (parent)
     BEZ_NAME: string;        // Bezirk (grandparent)
     
     // Raw values
     population: number;
     area_km2: number;
     pop_0_14: number;
     pop_15_64: number;
     pop_65_plus: number;
     
     // Computed
     density: number;         // pop / km²
     pct_0_14: number;        // percentage
     pct_15_64: number;
     pct_65_plus: number;
     
     // Ranks/percentiles (computed across all areas)
     density_percentile: number;
     pop_0_14_percentile: number;
     // ... etc
   }
   ```

4. **Generate Tiles**
   ```bash
   tippecanoe \
     -o public/data/berlin-lor.pmtiles \
     -Z 8 -z 14 \
     --layer=planungsraeume \
     --detect-shared-borders \
     --coalesce-densest-as-needed \
     --extend-zooms-if-still-dropping \
     data/processed/lor-with-data.geojson
   ```

5. **Generate Profiles JSON**
   ```typescript
   // Output: public/data/profiles/index.json
   {
     "metadata": {
       "generated": "2025-01-15T12:00:00Z",
       "source_date": "2024-12-31",
       "total_areas": 542  // LOR 2021 has 542 Planungsräume
     },
     "berlin_stats": {
       "population": 3755251,
       "density_median": 12500,
       "density_p25": 8200,
       "density_p75": 18400,
       // ... medians for all indicators
     },
     "areas": {
       "01011101": { /* ProcessedArea */ },
       "01011102": { /* ProcessedArea */ },
       // ...
     }
   }
   ```

### 1.4 Indicator Metadata

```typescript
// src/data/metadata.ts
export const INDICATORS = {
  population: {
    id: 'population',
    label: 'Population',
    labelDe: 'Einwohnerzahl',
    unit: 'people',
    format: (v: number) => v.toLocaleString('de-DE'),
    description: 'Total registered residents (Hauptwohnsitz)',
    source: 'Amt für Statistik Berlin-Brandenburg',
    sourceUrl: 'https://daten.berlin.de/datensaetze/einwohnerinnen-und-einwohner-in-berlin-in-lor-planungsraumen-am-31-12-2024',
    referenceDate: '2024-12-31',
    license: 'CC BY',
    colorScale: 'sequential-blue'
  },
  density: {
    id: 'density',
    label: 'Population Density',
    labelDe: 'Bevölkerungsdichte',
    unit: 'people/km²',
    format: (v: number) => `${v.toLocaleString('de-DE')} /km²`,
    description: 'Residents per square kilometer',
    source: 'Derived from population and LOR geometry area',
    referenceDate: '2024-12-31',
    license: 'CC BY',
    colorScale: 'sequential-orange'
  },
  // ... more indicators
} as const;
```

---

## Phase 2: Map Foundation

### 2.1 MapLibre + Stadia Setup

```tsx
// src/components/Map/MapContainer.tsx
import Map from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import { Protocol } from 'pmtiles';

// Register PMTiles protocol once at app startup
const protocol = new Protocol();
maplibregl.addProtocol('pmtiles', protocol.tile);

const STADIA_KEY = import.meta.env.VITE_STADIA_API_KEY;

// Stadia style URL format: base style + API key as query param
const MAP_STYLE = `https://tiles.stadiamaps.com/styles/alidade_smooth.json?api_key=${STADIA_KEY}`;

export function MapContainer() {
  return (
    <Map
      initialViewState={{
        longitude: 13.405,  // Berlin center
        latitude: 52.52,
        zoom: 10
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle={MAP_STYLE}
    >
      <LORLayer />
      <Tooltip />
    </Map>
  );
}
```

> **Stadia Style Options:**
> - `alidade_smooth` - muted, clean (recommended for data overlays)
> - `alidade_smooth_dark` - dark theme version
> - `osm_bright` - colorful OSM style
> - `stamen_toner` - high contrast B&W
> 
> Full list: https://docs.stadiamaps.com/map-styles/

### 2.2 Choropleth Layer

```tsx
// src/components/Map/LORLayer.tsx
<Source
  id="lor-source"
  type="vector"
  url="pmtiles://data/berlin-lor.pmtiles"
>
  <Layer
    id="lor-fill"
    type="fill"
    source-layer="planungsraeume"
    paint={{
      'fill-color': [
        'interpolate',
        ['linear'],
        ['get', activeIndicator],
        ...colorStops
      ],
      'fill-opacity': [
        'case',
        ['==', ['get', 'PLR_ID'], selectedAreaId],
        0.9,
        ['boolean', ['feature-state', 'hover'], false],
        0.75,
        0.6
      ]
    }}
  />
  <Layer
    id="lor-outline"
    type="line"
    source-layer="planungsraeume"
    paint={{
      'line-color': '#334155',
      'line-width': [
        'case',
        ['==', ['get', 'PLR_ID'], selectedAreaId],
        2.5,
        0.5
      ]
    }}
  />
</Source>
```

### 2.3 Hover & Click Handlers

```typescript
// Hover → show tooltip, set feature-state
const onMouseMove = useCallback((e: MapLayerMouseEvent) => {
  if (e.features?.length) {
    const feature = e.features[0];
    setHoveredArea(feature.properties);
    map.setFeatureState(
      { source: 'lor-source', sourceLayer: 'planungsraeume', id: feature.id },
      { hover: true }
    );
  }
}, []);

// Click → select area, open card
const onClick = useCallback((e: MapLayerMouseEvent) => {
  if (e.features?.length) {
    const areaId = e.features[0].properties.PLR_ID;
    setSelectedAreaId(areaId);
    // URL will update via useEffect
  }
}, []);
```

---

## Phase 3: UI Components (Days 6-8)

### 3.1 Legend Component

```tsx
// src/components/Map/Legend.tsx
export function Legend({ indicator, breaks }: LegendProps) {
  return (
    <div className="legend">
      <h4>{INDICATORS[indicator].label}</h4>
      <div className="legend-scale">
        {breaks.map((b, i) => (
          <div key={i} className="legend-item">
            <span 
              className="legend-color" 
              style={{ backgroundColor: b.color }} 
            />
            <span className="legend-label">
              {formatValue(b.min)} – {formatValue(b.max)}
            </span>
          </div>
        ))}
      </div>
      <div className="legend-nodata">
        <span className="legend-color nodata" />
        <span>No data</span>
      </div>
    </div>
  );
}
```

### 3.2 Area Card

```tsx
// src/components/AreaCard/AreaCard.tsx
export function AreaCard({ areaId }: { areaId: string }) {
  const { data: profile } = useAreaProfile(areaId);
  const berlinStats = useBerlinStats();
  
  if (!profile) return <CardSkeleton />;
  
  return (
    <aside className="area-card">
      <header>
        <h2>{profile.PLR_NAME}</h2>
        <p className="hierarchy">
          {profile.BZR_NAME} · {profile.BEZ_NAME}
        </p>
      </header>
      
      <section className="stats-grid">
        {DISPLAY_INDICATORS.map(ind => (
          <StatBlock
            key={ind}
            indicator={ind}
            value={profile[ind]}
            percentile={profile[`${ind}_percentile`]}
            berlinMedian={berlinStats[`${ind}_median`]}
          />
        ))}
      </section>
      
      <section className="visualizations">
        <PercentileBar
          value={profile.density}
          percentile={profile.density_percentile}
          label="Density vs Berlin"
        />
        <ComparisonTable
          area={profile}
          berlin={berlinStats}
          indicators={['population', 'density', 'pct_65_plus']}
        />
      </section>
      
      <SourcesBlock indicators={DISPLAY_INDICATORS} />
    </aside>
  );
}
```

### 3.3 Percentile Bar

```tsx
// src/components/AreaCard/PercentileBar.tsx
export function PercentileBar({ percentile, label }: Props) {
  return (
    <div className="percentile-bar">
      <div className="bar-track">
        <div 
          className="bar-fill" 
          style={{ width: `${percentile}%` }}
        />
        <div 
          className="bar-marker" 
          style={{ left: `${percentile}%` }}
        >
          <span className="marker-label">
            {Math.round(percentile)}th
          </span>
        </div>
      </div>
      <div className="bar-labels">
        <span>0</span>
        <span className="bar-label-center">{label}</span>
        <span>100</span>
      </div>
    </div>
  );
}
```

### 3.4 Search Box (Stadia Integration)

```tsx
// src/components/Search/SearchBox.tsx
import { useMap } from 'react-map-gl/maplibre';

export function SearchBox() {
  const { current: map } = useMap();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  
  const search = useDebouncedCallback(async (q: string) => {
    const res = await fetch(
      `https://api.stadiamaps.com/geocoding/v1/autocomplete?` +
      `text=${encodeURIComponent(q)}&` +
      `focus.point.lat=52.52&focus.point.lon=13.405&` +
      `boundary.country=DE&` +
      `api_key=${STADIA_KEY}`
    );
    const data = await res.json();
    setResults(data.features || []);
  }, 300);
  
  const selectResult = (feature: GeoJSON.Feature) => {
    const [lng, lat] = feature.geometry.coordinates;
    map.flyTo({ center: [lng, lat], zoom: 14 });
    // Find containing LOR area and select it
    const lorFeatures = map.queryRenderedFeatures(
      map.project([lng, lat]),
      { layers: ['lor-fill'] }
    );
    if (lorFeatures.length) {
      setSelectedAreaId(lorFeatures[0].properties.PLR_ID);
    }
  };
  
  return (
    <div className="search-box">
      <input
        type="text"
        placeholder="Search address..."
        value={query}
        onChange={e => { setQuery(e.target.value); search(e.target.value); }}
      />
      {results.length > 0 && (
        <ul className="search-results">
          {results.map(r => (
            <li key={r.properties.id} onClick={() => selectResult(r)}>
              {r.properties.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### 3.5 Layer Switcher

```tsx
// src/components/Map/LayerSwitcher.tsx
const LAYERS = [
  { id: 'density', label: 'Population Density', icon: '👥' },
  { id: 'pct_65_plus', label: 'Elderly (65+)', icon: '👴' },
  { id: 'pct_0_14', label: 'Youth (0-14)', icon: '👶' },
];

export function LayerSwitcher() {
  const [activeLayer, setActiveLayer] = useLayerStore(s => [s.activeLayer, s.setActiveLayer]);
  
  return (
    <div className="layer-switcher">
      {LAYERS.map(layer => (
        <button
          key={layer.id}
          className={clsx('layer-btn', activeLayer === layer.id && 'active')}
          onClick={() => setActiveLayer(layer.id)}
        >
          <span>{layer.icon}</span>
          <span>{layer.label}</span>
        </button>
      ))}
    </div>
  );
}
```

---

## Phase 4: State & URL Sync (Day 9)

### 4.1 URL Schema

```
https://berlin-atlas.app/#lat=52.52&lng=13.405&z=12&layer=density&area=01011101
```

### 4.2 URL State Hook

```typescript
// src/hooks/useMapState.ts
import { useSearchParams } from 'react-router-dom';

export function useMapState() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const mapState = useMemo(() => ({
    lat: parseFloat(searchParams.get('lat') || '52.52'),
    lng: parseFloat(searchParams.get('lng') || '13.405'),
    zoom: parseFloat(searchParams.get('z') || '10'),
    layer: searchParams.get('layer') || 'density',
    areaId: searchParams.get('area') || null,
  }), [searchParams]);
  
  const updateState = useCallback((updates: Partial<MapState>) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([k, v]) => {
        if (v != null) next.set(k, String(v));
        else next.delete(k);
      });
      return next;
    }, { replace: true });
  }, [setSearchParams]);
  
  return [mapState, updateState] as const;
}
```

### 4.3 Share Button

```tsx
// src/components/Controls/ShareButton.tsx
export function ShareButton() {
  const [copied, setCopied] = useState(false);
  
  const copyUrl = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <button className="share-btn" onClick={copyUrl}>
      {copied ? '✓ Copied!' : '🔗 Share'}
    </button>
  );
}
```

---

## Phase 5: Polish & Performance (Days 10-11)

### 5.1 Performance Checklist

- [ ] **Tile optimization**: Ensure PMTiles < 5MB for Berlin Planungsräume
- [ ] **Code splitting**: Lazy load AreaCard and heavy components
- [ ] **Caching**: Configure CDN headers for tiles and profiles
- [ ] **Preload**: Preload profiles JSON on app init
- [ ] **Skeleton states**: Show loading skeletons for card data

### 5.2 Mobile Responsiveness

```tsx
// src/components/Layout/MobileSheet.tsx
// Bottom sheet that slides up when area is selected on mobile
export function MobileSheet({ children, open }: Props) {
  return (
    <div className={clsx('mobile-sheet', open && 'open')}>
      <div className="sheet-handle" />
      <div className="sheet-content">{children}</div>
    </div>
  );
}
```

### 5.3 Accessibility

- [ ] Keyboard navigation for layer switcher
- [ ] ARIA labels for map controls
- [ ] Focus management when card opens
- [ ] Reduced motion support

### 5.4 Visual Design System

```css
/* src/styles/globals.css */
:root {
  /* Typography */
  --font-display: 'Instrument Sans', system-ui, sans-serif;
  --font-body: 'DM Sans', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Colors - Dark theme inspired by IDE aesthetics */
  --bg-primary: #0f1419;
  --bg-secondary: #1a2028;
  --bg-elevated: #252d38;
  --text-primary: #e6edf3;
  --text-secondary: #8b949e;
  --accent-primary: #58a6ff;
  --accent-secondary: #f78166;
  --accent-success: #56d364;
  
  /* Semantic colors for data */
  --data-low: #0d419d;
  --data-mid: #3b82f6;
  --data-high: #93c5fd;
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  
  /* Borders & Shadows */
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --shadow-card: 0 4px 24px rgba(0,0,0,0.4);
}
```

---

## Phase 6: Testing & Launch (Days 12-14)

### 6.1 Testing Checklist

**Functional Tests**
- [ ] Layer switch updates map, legend, tooltip
- [ ] Click selects area on desktop
- [ ] Click selects area on mobile (touch)
- [ ] Search returns Berlin results, fly-to works
- [ ] URL state persists across refresh
- [ ] Share URL reproduces exact view
- [ ] All metrics show source metadata

**Performance Tests**
- [ ] Time to usable map < 3s (Lighthouse)
- [ ] Area card displays < 300ms after click
- [ ] Smooth pan/zoom at 60fps
- [ ] Works on 3G throttled connection

**Browser Matrix**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Android

### 6.2 Deployment

```yaml
# Vercel/Netlify static deploy
build:
  command: npm run build
  output: dist

headers:
  - source: /data/**
    headers:
      - key: Cache-Control
        value: public, max-age=31536000, immutable
```

### 6.3 Launch Checklist

- [ ] Meta tags (OG image, description)
- [ ] Favicon and app icons
- [ ] 404 page
- [ ] Analytics (privacy-respecting)
- [ ] Error boundary with fallback UI
- [ ] Attribution footer with all licenses

---

## Timeline Summary

| Phase | Days | Deliverable |
|-------|------|-------------|
| 0. Setup | 1 | Project scaffold, deps, structure |
| 1. Data Pipeline | 2-3 | PMTiles + profiles JSON ready |
| 2. Map Foundation | 4-5 | Interactive choropleth working |
| 3. UI Components | 6-8 | Full UI with card, legend, search |
| 4. State & URL | 9 | Shareable URLs working |
| 5. Polish | 10-11 | Mobile, a11y, performance |
| 6. Testing & Launch | 12-14 | QA complete, deployed |

**Total: ~14 working days for MVP**

---

## Risk Mitigations

| Risk | Mitigation |
|------|------------|
| WFS returns different LOR version | Using `lor_2021` endpoint explicitly; validate 542 PLR IDs match CSV |
| PMTiles too large | Simplify geometry; limit zoom range; use vector-tile-reduce |
| Stadia rate limits | Cache geocoding results; implement debounce (300ms) |
| Mobile touch events conflict | Use react-map-gl's built-in touch handling |
| Indicator data gaps | Show "No data" gracefully in legend and card |
| LOR IDs mismatch between geometry & stats | Both datasets use same `PLR_ID` format (8-digit); verify join coverage |

---

## Future Enhancements (Post-MVP)

1. **Compare Mode**: Pin two areas side-by-side
2. **Ortsteile Toggle**: Larger area view option
3. **Time Series**: Historical data comparison
4. **Export**: PDF area report, JSON download
5. **Embedding**: iframe-friendly mode
6. **Localization**: English/German toggle

