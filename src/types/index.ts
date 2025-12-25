// Admin levels for Berlin
export type AdminLevel = 'planungsraum' | 'bezirk'

// LOR Area Types
// The geometry data only contains PLR_ID (8-digit code like "01100101")
// Format: BEZ(2 digits) + PGR(2) + BZR(2) + PLR(2)
// Example: "01100101" = Bezirk 01, Prognoseraum 10, Bezirksregion 01, Planungsraum 01
export interface ProcessedArea {
  PLR_ID: string        // 8-digit planning area identifier
  
  // Core demographics
  population: number    // E_E: Total population
  pop_male: number      // E_EM: Male population
  pop_female: number    // E_EW: Female population
  area_km2: number      // Calculated from geometry
  density: number       // pop / km²

  // Gender metrics
  pct_male: number      // Male percentage
  pct_female: number    // Female percentage
  sex_ratio: number     // Males per 100 females

  // Broad age groups
  pop_0_14: number      // Children and youth
  pop_15_64: number     // Working age
  pop_65_plus: number   // Retirement age
  pct_0_14: number      // Percentage 0-14
  pct_15_64: number     // Percentage 15-64
  pct_65_plus: number   // Percentage 65+

  // Granular age bands
  pop_0_5: number
  pop_6_14: number
  pop_15_17: number
  pop_18_24: number
  pop_25_34: number
  pop_35_44: number
  pop_45_54: number
  pop_55_64: number
  pop_65_79: number
  pop_80_plus: number
  
  pct_0_5: number
  pct_6_14: number
  pct_15_17: number
  pct_18_24: number
  pct_25_34: number
  pct_35_44: number
  pct_45_54: number
  pct_55_64: number
  pct_65_79: number
  pct_80_plus: number

  // Dependency ratios
  aging_index: number        // (65+ / 0-14) * 100
  dependency_ratio: number   // ((0-14 + 65+) / 15-64) * 100
  elderly_dependency: number // (65+ / 15-64) * 100
  youth_dependency: number   // (0-14 / 15-64) * 100

  // Percentiles (computed across all areas)
  density_percentile: number
  pct_0_14_percentile: number
  pct_15_64_percentile: number
  pct_65_plus_percentile: number
  population_percentile: number
  sex_ratio_percentile: number
  aging_index_percentile: number
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
  // Gender
  | 'pct_male'
  | 'pct_female'
  | 'sex_ratio'
  // Broad age groups
  | 'pct_0_14'
  | 'pct_15_64'
  | 'pct_65_plus'
  // Granular age bands
  | 'pct_0_5'
  | 'pct_6_14'
  | 'pct_15_17'
  | 'pct_18_24'
  | 'pct_25_34'
  | 'pct_35_44'
  | 'pct_45_54'
  | 'pct_55_64'
  | 'pct_65_79'
  | 'pct_80_plus'
  // Dependency indicators
  | 'aging_index'
  | 'dependency_ratio'
  | 'elderly_dependency'
  | 'youth_dependency'

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
  planungsraeume_count: number
  
  // Core demographics
  population: number
  pop_male: number
  pop_female: number
  area_km2: number
  density: number

  // Gender metrics
  pct_male: number
  pct_female: number
  sex_ratio: number

  // Broad age groups
  pop_0_14: number
  pop_15_64: number
  pop_65_plus: number
  pct_0_14: number
  pct_15_64: number
  pct_65_plus: number

  // Granular age bands
  pop_0_5: number
  pop_6_14: number
  pop_15_17: number
  pop_18_24: number
  pop_25_34: number
  pop_35_44: number
  pop_45_54: number
  pop_55_64: number
  pop_65_79: number
  pop_80_plus: number
  
  pct_0_5: number
  pct_6_14: number
  pct_15_17: number
  pct_18_24: number
  pct_25_34: number
  pct_35_44: number
  pct_45_54: number
  pct_55_64: number
  pct_65_79: number
  pct_80_plus: number

  // Dependency ratios
  aging_index: number
  dependency_ratio: number
  elderly_dependency: number
  youth_dependency: number

  // Percentiles
  density_percentile: number
  population_percentile: number
  pct_0_14_percentile: number
  pct_65_plus_percentile: number
  sex_ratio_percentile: number
  aging_index_percentile: number
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

