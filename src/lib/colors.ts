import { COLOR_SCALES } from '@/data/layers'
import type { ColorScaleId } from '@/types'

/**
 * Interpolate between two colors
 */
export function interpolateColor(color1: string, color2: string, factor: number): string {
  const c1 = hexToRgb(color1)
  const c2 = hexToRgb(color2)

  if (!c1 || !c2) return color1

  const r = Math.round(c1.r + (c2.r - c1.r) * factor)
  const g = Math.round(c1.g + (c2.g - c1.g) * factor)
  const b = Math.round(c1.b + (c2.b - c1.b) * factor)

  return rgbToHex(r, g, b)
}

/**
 * Get color for a value within a range using a color scale
 */
export function getColorForValue(
  value: number,
  min: number,
  max: number,
  colorScaleId: ColorScaleId
): string {
  const colors = COLOR_SCALES[colorScaleId]
  const normalizedValue = Math.max(0, Math.min(1, (value - min) / (max - min)))
  const index = normalizedValue * (colors.length - 1)
  const lowerIndex = Math.floor(index)
  const upperIndex = Math.ceil(index)

  if (lowerIndex === upperIndex) {
    return colors[lowerIndex] ?? colors[0] ?? '#cccccc'
  }

  const lowerColor = colors[lowerIndex]
  const upperColor = colors[upperIndex]

  if (!lowerColor || !upperColor) return '#cccccc'

  return interpolateColor(lowerColor, upperColor, index - lowerIndex)
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1] ?? '0', 16),
        g: parseInt(result[2] ?? '0', 16),
        b: parseInt(result[3] ?? '0', 16),
      }
    : null
}

/**
 * Convert RGB to hex color
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`
}

/**
 * Determine if a color is light or dark (for text contrast)
 */
export function isLightColor(hex: string): boolean {
  const rgb = hexToRgb(hex)
  if (!rgb) return false

  // Using relative luminance formula
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  return luminance > 0.5
}

