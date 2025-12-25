import type { IndicatorId, ColorScaleId, ColorBreak } from '../types'

// Color scales for different indicator types
export const COLOR_SCALES: Record<ColorScaleId, string[]> = {
  'sequential-blue': [
    '#f7fbff',
    '#deebf7',
    '#c6dbef',
    '#9ecae1',
    '#6baed6',
    '#4292c6',
    '#2171b5',
    '#08519c',
    '#08306b',
  ],
  'sequential-orange': [
    '#fff5eb',
    '#fee6ce',
    '#fdd0a2',
    '#fdae6b',
    '#fd8d3c',
    '#f16913',
    '#d94801',
    '#a63603',
    '#7f2704',
  ],
  'sequential-green': [
    '#f7fcf5',
    '#e5f5e0',
    '#c7e9c0',
    '#a1d99b',
    '#74c476',
    '#41ab5d',
    '#238b45',
    '#006d2c',
    '#00441b',
  ],
  'sequential-purple': [
    '#fcfbfd',
    '#efedf5',
    '#dadaeb',
    '#bcbddc',
    '#9e9ac8',
    '#807dba',
    '#6a51a3',
    '#54278f',
    '#3f007d',
  ],
  diverging: [
    '#b2182b',
    '#d6604d',
    '#f4a582',
    '#fddbc7',
    '#f7f7f7',
    '#d1e5f0',
    '#92c5de',
    '#4393c3',
    '#2166ac',
  ],
}

// Default data ranges for each indicator (will be overwritten by actual data)
export const DEFAULT_RANGES: Record<IndicatorId, { min: number; max: number }> = {
  // Core
  population: { min: 0, max: 30000 },
  density: { min: 0, max: 40000 },
  
  // Gender
  pct_male: { min: 45, max: 55 },
  pct_female: { min: 45, max: 55 },
  sex_ratio: { min: 85, max: 115 },
  
  // Broad age groups
  pct_0_14: { min: 5, max: 25 },
  pct_15_64: { min: 50, max: 80 },
  pct_65_plus: { min: 5, max: 35 },
  
  // Granular age bands
  pct_0_5: { min: 0, max: 8 },
  pct_6_14: { min: 0, max: 12 },
  pct_15_17: { min: 0, max: 5 },
  pct_18_24: { min: 0, max: 15 },
  pct_25_34: { min: 5, max: 25 },
  pct_35_44: { min: 5, max: 20 },
  pct_45_54: { min: 5, max: 20 },
  pct_55_64: { min: 5, max: 20 },
  pct_65_79: { min: 5, max: 25 },
  pct_80_plus: { min: 0, max: 10 },
  
  // Dependency indicators
  aging_index: { min: 0, max: 300 },
  dependency_ratio: { min: 20, max: 100 },
  elderly_dependency: { min: 10, max: 60 },
  youth_dependency: { min: 10, max: 50 },
}

// Generate color breaks for a given indicator
export function generateColorBreaks(
  _indicator: IndicatorId,
  colorScaleId: ColorScaleId,
  min: number,
  max: number
): ColorBreak[] {
  const colors = COLOR_SCALES[colorScaleId]
  const numBreaks = colors.length
  const step = (max - min) / numBreaks

  return colors.map((color, i) => ({
    min: min + step * i,
    max: min + step * (i + 1),
    color,
  }))
}

// Generate MapLibre interpolation expression for fill-color
export function generateColorExpression(
  indicator: IndicatorId,
  colorScaleId: ColorScaleId,
  min: number,
  max: number
): (string | number | string[])[] {
  const colors = COLOR_SCALES[colorScaleId]
  const numStops = colors.length
  const step = (max - min) / (numStops - 1)

  const stops: (number | string)[] = []
  colors.forEach((color, i) => {
    stops.push(min + step * i)
    stops.push(color)
  })

  return ['interpolate', ['linear'], ['get', indicator as string], ...stops]
}

// No data color
export const NO_DATA_COLOR = '#2d3748'

// Selected area outline color
export const SELECTED_OUTLINE_COLOR = '#58a6ff'

// Default outline color
export const DEFAULT_OUTLINE_COLOR = '#334155'

