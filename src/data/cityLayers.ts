// City-specific layer availability
import type { CityId } from '../../cities'
import type { IndicatorId } from '@/types'

/**
 * Define which indicators are available for each city
 * based on the data fields present in their GeoJSON/profiles
 */
export const CITY_AVAILABLE_INDICATORS: Record<CityId, IndicatorId[]> = {
  // Berlin has full demographic data
  berlin: [
    'density',
    'pct_65_plus',
    'pct_0_14',
    'population',
    'sex_ratio',
    'aging_index',
    'pct_18_24',
    'pct_80_plus',
    'pct_15_64',
    'pct_male',
    'pct_female',
    'pct_0_5',
    'pct_6_14',
    'pct_15_17',
    'pct_25_34',
    'pct_35_44',
    'pct_45_54',
    'pct_55_64',
    'pct_65_79',
    'dependency_ratio',
    'elderly_dependency',
    'youth_dependency',
  ],
  
  // Hamburg only has population data
  hamburg: [
    'population',
  ],
  
  // Munich has population and density
  munich: [
    'population',
    'density',
  ],
}

/**
 * Check if an indicator is available for a given city
 */
export function isIndicatorAvailableForCity(
  cityId: CityId,
  indicatorId: IndicatorId
): boolean {
  const indicators = CITY_AVAILABLE_INDICATORS[cityId]
  return indicators.includes(indicatorId)
}

/**
 * Get available indicators for a city
 */
export function getAvailableIndicators(cityId: CityId): IndicatorId[] {
  return CITY_AVAILABLE_INDICATORS[cityId]
}

/**
 * Filter layer options to only show available ones for the current city
 */
export function getAvailableLayerOptions(
  cityId: CityId,
  allLayerOptions: Array<{ id: IndicatorId; label: string; icon: string }>
): Array<{ id: IndicatorId; label: string; icon: string }> {
  const availableIndicators = CITY_AVAILABLE_INDICATORS[cityId]

  return allLayerOptions.filter((option) =>
    availableIndicators.includes(option.id)
  )
}


