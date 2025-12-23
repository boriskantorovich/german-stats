import { useMemo } from 'react'
import { useAppStore } from '../store/appStore'
import { INDICATORS } from '../data/metadata'
import { generateColorBreaks, generateColorExpression, DEFAULT_RANGES } from '../data/layers'
import { useProfilesData } from './useAreaData'
import { calculateStats } from '../lib/stats'
import type { IndicatorId, ColorBreak } from '../types'

interface LayerConfig {
  indicator: IndicatorId
  indicatorMeta: (typeof INDICATORS)[IndicatorId]
  colorBreaks: ColorBreak[]
  colorExpression: (string | number | string[])[]
  min: number
  max: number
  isLoading: boolean
}

/**
 * Hook to get current layer configuration including color breaks
 */
export function useLayerConfig(): LayerConfig {
  const activeLayer = useAppStore((s) => s.activeLayer)
  const { data: profiles, isLoading } = useProfilesData()

  const config = useMemo(() => {
    const indicatorMeta = INDICATORS[activeLayer]

    // Calculate actual min/max from data if available
    let min = DEFAULT_RANGES[activeLayer].min
    let max = DEFAULT_RANGES[activeLayer].max

    if (profiles?.areas) {
      const values = Object.values(profiles.areas)
        .map((a) => {
          const val = a[activeLayer as keyof typeof a]
          return typeof val === 'number' ? val : null
        })
        .filter((v): v is number => v !== null)

      if (values.length > 0) {
        const stats = calculateStats(values)
        min = stats.min
        max = stats.max
      }
    }

    const colorBreaks = generateColorBreaks(activeLayer, indicatorMeta.colorScale, min, max)

    const colorExpression = generateColorExpression(activeLayer, indicatorMeta.colorScale, min, max)

    return {
      indicator: activeLayer,
      indicatorMeta,
      colorBreaks,
      colorExpression,
      min,
      max,
      isLoading,
    }
  }, [activeLayer, profiles, isLoading])

  return config
}

/**
 * Hook to get formatted value for an indicator
 */
export function useFormattedValue(indicator: IndicatorId, value: number | undefined): string {
  const meta = INDICATORS[indicator]
  if (value === undefined || value === null) return 'N/A'
  return meta.format(value)
}

