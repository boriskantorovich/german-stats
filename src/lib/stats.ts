/**
 * Calculate percentile of a value within a sorted array
 */
export function calculatePercentile(value: number, sortedValues: number[]): number {
  if (sortedValues.length === 0) return 0

  let count = 0
  for (const v of sortedValues) {
    if (v < value) count++
    else break
  }

  return (count / sortedValues.length) * 100
}

/**
 * Calculate percentile rank for each item in an array
 */
export function calculatePercentileRanks(values: number[]): number[] {
  const sorted = [...values].sort((a, b) => a - b)
  return values.map((v) => calculatePercentile(v, sorted))
}

/**
 * Get value at a specific percentile from a sorted array
 */
export function getValueAtPercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0

  const index = Math.ceil((percentile / 100) * sortedValues.length) - 1
  return sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))] ?? 0
}

/**
 * Calculate basic statistics for an array of numbers
 */
export function calculateStats(values: number[]): {
  min: number
  max: number
  mean: number
  median: number
  p25: number
  p75: number
} {
  if (values.length === 0) {
    return { min: 0, max: 0, mean: 0, median: 0, p25: 0, p75: 0 }
  }

  const sorted = [...values].sort((a, b) => a - b)
  const sum = values.reduce((acc, v) => acc + v, 0)

  return {
    min: sorted[0] ?? 0,
    max: sorted[sorted.length - 1] ?? 0,
    mean: sum / values.length,
    median: getValueAtPercentile(sorted, 50),
    p25: getValueAtPercentile(sorted, 25),
    p75: getValueAtPercentile(sorted, 75),
  }
}

/**
 * Format a percentile value for display
 */
export function formatPercentile(percentile: number): string {
  const rounded = Math.round(percentile)
  const suffix = getOrdinalSuffix(rounded)
  return `${rounded}${suffix}`
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 */
function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0] || 'th'
}

