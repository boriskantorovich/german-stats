import type { CityId, IndicatorId } from '../types'

export const DEFAULT_CITY_ID: CityId = 'berlin'

export const CITY_COORDS: Record<CityId, { center: [number, number]; zoom: number }> = {
  berlin: { center: [13.405, 52.52], zoom: 10 },
  hamburg: { center: [10.0, 53.55], zoom: 10 },
  munich: { center: [11.575, 48.137], zoom: 11 },
}

export const DEFAULT_LAYER: IndicatorId = 'density'

