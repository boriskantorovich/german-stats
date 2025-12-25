// Admin levels for Berlin
export type AdminLevel = 'planungsraum' | 'bezirk'

// LOR Area Types
// The geometry data only contains PLR_ID (8-digit code like "01100101")
// Format: BEZ(2 digits) + PGR(2) + BZR(2) + PLR(2)
// Example: "01100101" = Bezirk 01, Prognoseraum 10, Bezirksregion 01, Planungsraum 01
export interface ProcessedArea {
  PLR_ID: string        // 8-digit planning area identifier
  // Raw values from CSV
  population: number    // E_E: Total population
  area_km2: number      // Calculated from geometry

  // Age groups (aggregated from CSV columns)
  // Source: E_EU1 + E_E1U6 + E_E6U15 = 0-14 years
  //         E_E15U18 + E_E18U25 + E_E25U55 + E_E55U65 = 15-64 years
  //         E_E65U80 + E_E80U110 = 65+ years
  pop_0_14: number      // Children and youth
  pop_15_64: number     // Working age
  pop_65_plus: number   // Retirement age

  // Computed - Derived metrics
  density: number       // pop / km²
  pct_0_14: number      // percentage of population 0-14
  pct_15_64: number     // percentage of population 15-64
  pct_65_plus: number   // percentage of population 65+

  // Ranks/percentiles (computed across all areas)
  density_percentile: number
  pct_0_14_percentile: number
  pct_15_64_percentile: number
  pct_65_plus_percentile: number
  population_percentile: number
}

// Berlin aggregate stats
export interface BerlinStats {
  population: number
  total_areas: number
  density_median: number
  density_p25: number
  density_p75: number
  density_min: number
  density_max: number
  pct_0_14_median: number
  pct_15_64_median: number
  pct_65_plus_median: number
}

// Profile data structure
export interface ProfilesData {
  metadata: {
    generated: string
    source_date: string
    total_areas: number
  }
  berlin_stats: BerlinStats
  areas: Record<string, ProcessedArea>
}

// Map state
export interface MapState {
  lat: number
  lng: number
  zoom: number
  layer: IndicatorId
  areaId: string | null
}

// Indicator definitions
export type IndicatorId =
  | 'population'
  | 'density'
  | 'pct_0_14'
  | 'pct_15_64'
  | 'pct_65_plus'

export interface IndicatorMeta {
  id: IndicatorId
  label: string
  labelDe: string
  unit: string
  format: (value: number) => string
  description: string
  source: string
  sourceUrl?: string
  referenceDate: string
  license: string
  colorScale: ColorScaleId
}

export type ColorScaleId =
  | 'sequential-blue'
  | 'sequential-orange'
  | 'sequential-green'
  | 'sequential-purple'
  | 'diverging'

// Color scale break
export interface ColorBreak {
  min: number
  max: number
  color: string
}

// Hover tooltip data
export interface TooltipData {
  areaId: string
  name: string
  value: number
  x: number
  y: number
}

// GeoJSON Feature properties from PMTiles
export interface LORFeatureProperties {
  PLR_ID: string
  population?: number
  density?: number
  pct_0_14?: number
  pct_15_64?: number
  pct_65_plus?: number
  [key: string]: string | number | undefined
}

// Bezirk (District) types
export interface BezirkData {
  BEZ_ID: string
  BEZ_NAME: string
  population: number
  pop_male: number
  pop_female: number
  area_km2: number
  pop_0_14: number
  pop_15_64: number
  pop_65_plus: number
  density: number
  pct_0_14: number
  pct_15_64: number
  pct_65_plus: number
  pct_male: number
  pct_female: number
  planungsraeume_count: number
  density_percentile: number
  population_percentile: number
  pct_0_14_percentile: number
  pct_65_plus_percentile: number
}

export interface BezirkeProfilesData {
  metadata: {
    generated: string
    source_date: string
    total_bezirke: number
  }
  berlin_stats: {
    population: number
    total_bezirke: number
    density_median: number
    pct_0_14_median: number
    pct_65_plus_median: number
  }
  bezirke: Record<string, BezirkData>
}

// GeoJSON Feature properties for Bezirke
export interface BezirkFeatureProperties {
  BEZ_ID: string
  BEZ_NAME: string
  population?: number
  density?: number
  pct_0_14?: number
  pct_15_64?: number
  pct_65_plus?: number
  pct_male?: number
  [key: string]: string | number | undefined
}

