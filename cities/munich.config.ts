/**
 * Munich city configuration  
 * 25 Stadtbezirke (City Districts)
 * Data downloaded from OpenData München
 */

import type { CityConfig } from './types'

export const munichConfig: CityConfig = {
  id: 'munich',
  name: 'München',
  
  geometry: {
    source: 'file',
    url: 'data/processed/munich/with-data-wgs84.geojson',
    format: 'geojson',
    crs: 'EPSG:4326',  // WGS84 after reprojection
    idField: 'id',  // Our processed ID field
    nameField: 'name',  // Our processed name field
    hierarchyFields: [],  // Munich has flat structure
  },
  
  demographics: {
    source: 'file',
    file: 'data/raw/munich/demographics.csv',
    idField: 'stadtbezirksnummer',
    encoding: 'utf-8',
    delimiter: ',',
    fieldMapping: {
      population: 'bevölkerung',
      area_hectares: 'fläche in ha',
      population_density: 'einwohnerdichte',
    },
  },
  
  display: {
    center: [11.5761, 48.1372],
    zoom: 10,
    unitName: 'Stadtbezirk',
    unitNamePlural: 'Stadtbezirke',
  },
  
  metadata: {
    population: 1603776,  // Dec 31, 2024 (official)
    areaKm2: 310,
    districts: 25,
    lastUpdate: '2024-12-31',
    dataProvider: 'Landeshauptstadt München',
    license: 'Open Data / CC BY',
    sourceUrl: 'https://opendata.muenchen.de/',
  },
}
