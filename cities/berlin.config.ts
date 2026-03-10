/**
 * Berlin city configuration
 * LOR (Lebensweltlich orientierte Räume) 2021
 */

import type { CityConfig } from './types'

export const berlinConfig: CityConfig = {
  id: 'berlin',
  name: 'Berlin',
  
  geometry: {
    source: 'file',
    url: 'https://www.berlin.de/sen/sbw/_assets/stadtdaten/stadtwissen/lebensweltlich-orientierte-raeume/lor_2021-01-01_k3_shapefiles_nur_id.7z',
    format: 'geojson',  // After conversion from shapefile
    crs: 'EPSG:25833',  // ETRS89 UTM 33N
    idField: 'PLR_ID',
    nameField: 'PLR_NAME',
    hierarchyFields: ['BEZ_NAME', 'BZR_NAME'],  // Bezirk, Bezirksregion
  },
  
  demographics: {
    source: 'csv',
    url: 'https://www.statistik-berlin-brandenburg.de/opendata/EWR_L21_202412E_Matrix.csv',
    idField: 'PLR',  // Will be padded to create PLR_ID
    encoding: 'utf-8',
    delimiter: ';',
    fieldMapping: {
      population: 'E_E',  // Total population
      male: 'E_EM',
      female: 'E_EW',
      age_0_5: 'E_E00_05',
      age_6_14: 'E_E06_14',
      age_15_17: 'E_E15_17',
      age_18_24: 'E_E18_24',
      age_25_34: 'E_E25_34',
      age_35_44: 'E_E35_44',
      age_45_54: 'E_E45_54',
      age_55_64: 'E_E55_64',
      age_65_79: 'E_E65_79',
      age_80_plus: 'E_E80_XX',
    },
  },
  
  display: {
    center: [13.405, 52.52],
    zoom: 10,
    unitName: 'Planungsraum',
    unitNamePlural: 'Planungsräume',
  },
  
  metadata: {
    population: 3755251,  // Dec 2024
    areaKm2: 892,
    districts: 542,  // LOR 2021 planning areas
    lastUpdate: '2024-12-31',
    dataProvider: 'Amt für Statistik Berlin-Brandenburg',
    license: 'CC BY 3.0 DE',
    sourceUrl: 'https://www.statistik-berlin-brandenburg.de',
  },
}


