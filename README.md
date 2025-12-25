# Berlin Neighbourhood Atlas

A premium, map-first neighbourhood atlas for Berlin using LOR Planungsräume as the spatial unit. Explore, understand, compare, and share neighbourhood data through an interactive choropleth map with rich area cards.

![Berlin Neighbourhood Atlas](https://img.shields.io/badge/Berlin-Neighbourhood%20Atlas-58a6ff?style=for-the-badge)

## Features

- 🗺️ **Interactive Choropleth Map** - Explore 542 Berlin Planungsräume with smooth pan/zoom
- 📊 **Multiple Data Layers** - Switch between population density, age demographics, and more
- 📍 **Area Details** - Click any neighbourhood for detailed statistics and comparisons
- 🔍 **Address Search** - Find any Berlin address and see its neighbourhood data
- 🔗 **Shareable URLs** - Every view is linkable for easy sharing
- 📱 **Responsive Design** - Works beautifully on desktop and mobile

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build**: Vite 6
- **Maps**: MapLibre GL JS + react-map-gl
- **Tiles**: PMTiles (self-hosted vector tiles)
- **Styling**: Tailwind CSS
- **State**: Zustand + React Query
- **Basemap**: Stadia Maps (or CARTO fallback)

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment (optional - for address search)
cp .env.example .env
# Edit .env and add your Stadia Maps API key

# Start development server
npm run dev
```

## Data Pipeline

The app uses LOR 2021 (Lebensweltlich orientierte Räume) data from Berlin Open Data.

**Prerequisites:**
- LOR 2021 geometry must be downloaded and converted manually (see DATA_SOURCES.md)
- Requires `p7zip` and `gdal` for Shapefile conversion

```bash
# 1. Download & convert LOR 2021 Shapefile (see DATA_SOURCES.md for details)
curl -O "https://www.berlin.de/sen/sbw/_assets/stadtdaten/stadtwissen/lebensweltlich-orientierte-raeume/lor_2021-01-01_k3_shapefiles_nur_id.7z"
7z x lor_2021-01-01_k3_shapefiles_nur_id.7z
ogr2ogr -f GeoJSON -t_srs EPSG:4326 data/raw/lor-planungsraeume.geojson lor_planungsraeume_2021.shp

# 2. Verify geometry file
npx tsx scripts/01-fetch-geometry.ts

# 3. Fetch population demographics
npx tsx scripts/02-fetch-demographics.ts

# 4. Join and process data
npx tsx scripts/03-process-data.ts

# 5. Generate PMTiles (requires tippecanoe)
./scripts/04-generate-tiles.sh
```

### Prerequisites for Data Pipeline

- Node.js 18+
- [tippecanoe](https://github.com/felt/tippecanoe) for generating PMTiles

```bash
# Install tippecanoe on macOS
brew install tippecanoe
```

## Project Structure

```
src/
├── components/
│   ├── Map/           # Map container, layers, legend, tooltip
│   ├── AreaCard/      # Area details card components
│   ├── Search/        # Address search
│   ├── Controls/      # Share button, etc.
│   └── Layout/        # App shell, mobile sheet
├── hooks/             # Custom React hooks
├── store/             # Zustand store
├── data/              # Layer configs, metadata
├── lib/               # Utilities (colors, stats, URL)
├── types/             # TypeScript types
└── styles/            # Global CSS

scripts/               # Data pipeline scripts
public/data/           # Static data files (PMTiles, profiles)
```

## Data Sources

| Dataset | Source | License |
|---------|--------|---------|
| LOR Geometry (2021) | [Berlin Open Data](https://daten.berlin.de/datensaetze/lebensweltlich-orientierte-raume-lor-01-01-2021-wfs-34c86848) | CC BY 3.0 DE |
| Population (2024) | [Amt für Statistik](https://daten.berlin.de/datensaetze/einwohnerinnen-und-einwohner-in-berlin-in-lor-planungsraumen-am-31-12-2024) | CC BY |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_STADIA_API_KEY` | Stadia Maps API key for basemap and geocoding | Optional (falls back to CARTO) |

Get a free API key at [stadiamaps.com](https://stadiamaps.com/)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## License

MIT

## Acknowledgments

- Data provided by Amt für Statistik Berlin-Brandenburg
- Basemap tiles by Stadia Maps / CARTO
- Built with MapLibre GL JS

