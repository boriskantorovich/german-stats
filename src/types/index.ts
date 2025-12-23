// LOR Area Types
export interface LORArea {
  PLR_ID: string
  PLR_NAME: string
  BZR_ID: string
  BZR_NAME: string
  BEZ_ID: string
  BEZ_NAME: string
}

export interface ProcessedArea extends LORArea {
  // Raw values
  population: number
  area_km2: number
  pop_0_5: number
  pop_6_14: number
  pop_15_17: number
  pop_18_24: number
  pop_25_54: number
  pop_55_64: number
  pop_65_79: number
  pop_80_plus: number

  // Computed - Age groups (simplified)
  pop_0_14: number
  pop_15_64: number
  pop_65_plus: number

  // Computed - Derived metrics
  density: number // pop / km²
  pct_0_14: number // percentage
  pct_15_64: number
  pct_65_plus: number

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
  PLR_NAME: string
  BZR_ID: string
  BZR_NAME: string
  BEZ_ID: string
  BEZ_NAME: string
  population?: number
  density?: number
  pct_0_14?: number
  pct_15_64?: number
  pct_65_plus?: number
  [key: string]: string | number | undefined
}

