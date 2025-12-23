import type { IndicatorId, IndicatorMeta } from '../types'

export const INDICATORS: Record<IndicatorId, IndicatorMeta> = {
  population: {
    id: 'population',
    label: 'Population',
    labelDe: 'Einwohnerzahl',
    unit: 'people',
    format: (v: number) => v.toLocaleString('de-DE'),
    description: 'Total registered residents (Hauptwohnsitz)',
    source: 'Amt für Statistik Berlin-Brandenburg',
    sourceUrl:
      'https://daten.berlin.de/datensaetze/einwohnerinnen-und-einwohner-in-berlin-in-lor-planungsraumen-am-31-12-2024',
    referenceDate: '2024-12-31',
    license: 'CC BY',
    colorScale: 'sequential-blue',
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
    colorScale: 'sequential-orange',
  },
  pct_0_14: {
    id: 'pct_0_14',
    label: 'Youth (0-14)',
    labelDe: 'Jugend (0-14)',
    unit: '%',
    format: (v: number) => `${v.toFixed(1)}%`,
    description: 'Percentage of population aged 0-14 years',
    source: 'Amt für Statistik Berlin-Brandenburg',
    sourceUrl:
      'https://daten.berlin.de/datensaetze/einwohnerinnen-und-einwohner-in-berlin-in-lor-planungsraumen-am-31-12-2024',
    referenceDate: '2024-12-31',
    license: 'CC BY',
    colorScale: 'sequential-green',
  },
  pct_15_64: {
    id: 'pct_15_64',
    label: 'Working Age (15-64)',
    labelDe: 'Erwerbsfähige (15-64)',
    unit: '%',
    format: (v: number) => `${v.toFixed(1)}%`,
    description: 'Percentage of population aged 15-64 years',
    source: 'Amt für Statistik Berlin-Brandenburg',
    sourceUrl:
      'https://daten.berlin.de/datensaetze/einwohnerinnen-und-einwohner-in-berlin-in-lor-planungsraumen-am-31-12-2024',
    referenceDate: '2024-12-31',
    license: 'CC BY',
    colorScale: 'sequential-blue',
  },
  pct_65_plus: {
    id: 'pct_65_plus',
    label: 'Elderly (65+)',
    labelDe: 'Senioren (65+)',
    unit: '%',
    format: (v: number) => `${v.toFixed(1)}%`,
    description: 'Percentage of population aged 65 and over',
    source: 'Amt für Statistik Berlin-Brandenburg',
    sourceUrl:
      'https://daten.berlin.de/datensaetze/einwohnerinnen-und-einwohner-in-berlin-in-lor-planungsraumen-am-31-12-2024',
    referenceDate: '2024-12-31',
    license: 'CC BY',
    colorScale: 'sequential-purple',
  },
} as const

export const DISPLAY_INDICATORS: IndicatorId[] = [
  'population',
  'density',
  'pct_0_14',
  'pct_65_plus',
]

export const LAYER_OPTIONS = [
  { id: 'density' as const, label: 'Population Density', icon: '👥' },
  { id: 'pct_65_plus' as const, label: 'Elderly (65+)', icon: '👴' },
  { id: 'pct_0_14' as const, label: 'Youth (0-14)', icon: '👶' },
  { id: 'population' as const, label: 'Total Population', icon: '📊' },
]

