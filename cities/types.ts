/**
 * City configuration types for universal data pipeline
 */

export interface FieldMapping {
  population: string
  area_hectares?: string
  population_density?: string
  male?: string
  female?: string
  age_0_5?: string
  age_6_14?: string
  age_15_17?: string
  age_18_24?: string
  age_25_34?: string
  age_35_44?: string
  age_45_54?: string
  age_55_64?: string
  age_65_79?: string
  age_80_plus?: string
  // Simplified mappings if granular not available
  age_0_14?: string
  age_15_64?: string
  age_65_plus?: string
}

export interface GeometryConfig {
  source: 'file' | 'wfs' | 'url'
  url: string
  format: 'geojson' | 'shapefile' | 'gml' | 'wfs'
  crs?: string  // Source CRS, e.g., "EPSG:25833"
  idField: string  // Field to use as unique ID
  nameField: string  // Field for area name
  hierarchyFields?: string[]  // Parent area fields (e.g., ["BEZ_NAME", "BZR_NAME"])
}

export interface DemographicsConfig {
  source: 'csv' | 'excel' | 'api' | 'file'
  url?: string  // For downloads
  file?: string  // For local files
  format?: 'csv' | 'xlsx'
  idField: string  // Field to join with geometry
  encoding?: string  // e.g., "utf-8", "latin1"
  delimiter?: string  // e.g., ";", ","
  skipRows?: number  // Rows to skip
  fieldMapping: FieldMapping
}

export interface DisplayConfig {
  center: [number, number]  // [lng, lat]
  zoom: number
  unitName: string  // e.g., "Planungsraum", "Stadtteil"
  unitNamePlural: string  // e.g., "Planungsräume", "Stadtteile"
}

export interface MetadataConfig {
  population: number
  areaKm2: number
  districts: number
  lastUpdate: string
  dataProvider: string
  license: string
  sourceUrl?: string
}

export interface CityConfig {
  id: string
  name: string
  geometry: GeometryConfig
  demographics: DemographicsConfig
  display: DisplayConfig
  metadata: MetadataConfig
}

export type CityId = 'berlin' | 'hamburg' | 'munich'

export interface ProcessedCity {
  config: CityConfig
  features: number
  processedAreas: number
  outputFiles: {
    geojson: string
    profiles: string
    tiles?: string
  }
}


