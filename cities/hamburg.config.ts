/**
 * Hamburg city configuration
 * 104 Stadtteile (Districts)
 */

import type { CityConfig } from './types'

export const hamburgConfig: CityConfig = {
  id: 'hamburg',
  name: 'Hamburg',
  
  geometry: {
    source: 'wfs',
    url: 'https://geodienste.hamburg.de/HH_WFS_Verwaltungsgrenzen?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAME=app:stadtteile',
    format: 'gml',  // WFS returns GML, needs conversion
    crs: 'EPSG:25832',  // UTM 32N
    idField: 'stadtteil_schluessel',  // 5-digit code
    nameField: 'stadtteil_name',
    hierarchyFields: ['bezirk_name'],  // Parent Bezirk
  },
  
  demographics: {
    source: 'file',  // Needs to be found and downloaded
    file: 'data/raw/hamburg/demographics.csv',
    idField: 'stadtteil_schluessel',
    encoding: 'utf-8',
    delimiter: ';',
    fieldMapping: {
      population: 'Einwohner',  // TBD - actual field names
      age_0_14: 'unter_18',  // TBD
      age_15_64: 'von_18_bis_64',  // TBD
      age_65_plus: 'ab_65',  // TBD
      // Hamburg may use different age brackets - to be determined
    },
  },
  
  display: {
    center: [10.0, 53.55],
    zoom: 10,
    unitName: 'Stadtteil',
    unitNamePlural: 'Stadtteile',
  },
  
  metadata: {
    population: 1945532,  // 2024 estimate
    areaKm2: 755,
    districts: 104,
    lastUpdate: '2024',
    dataProvider: 'Statistikamt Nord',
    license: 'Open Data',
    sourceUrl: 'https://www.statistik-nord.de',
  },
}


