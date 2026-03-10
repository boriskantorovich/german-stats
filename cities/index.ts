/**
 * City configuration registry
 */

import { berlinConfig } from './berlin.config'
import { hamburgConfig } from './hamburg.config'
import { munichConfig } from './munich.config'
import type { CityConfig } from './types'

export const CITIES: Record<string, CityConfig> = {
  berlin: berlinConfig,
  hamburg: hamburgConfig,
  munich: munichConfig,
}

export function getCityConfig(cityId: string): CityConfig | undefined {
  return CITIES[cityId]
}

export function getAllCities(): CityConfig[] {
  return Object.values(CITIES)
}

export function getCityIds(): string[] {
  return Object.keys(CITIES)
}

export * from './types'
export { berlinConfig, hamburgConfig, munichConfig }


