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
  population: { min: 0, max: 30000 },
  density: { min: 0, max: 40000 },
  pct_0_14: { min: 5, max: 25 },
  pct_15_64: { min: 50, max: 80 },
  pct_65_plus: { min: 5, max: 35 },
}

// Generate color breaks for a given indicator
export function generateColorBreaks(
  indicator: IndicatorId,
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

  return ['interpolate', ['linear'], ['get', indicator], ...stops]
}

// No data color
export const NO_DATA_COLOR = '#2d3748'

// Selected area outline color
export const SELECTED_OUTLINE_COLOR = '#58a6ff'

// Default outline color
export const DEFAULT_OUTLINE_COLOR = '#334155'

