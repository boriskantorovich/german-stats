import type { MapState, IndicatorId } from '../types'
import { CITY_COORDS, DEFAULT_CITY_ID, DEFAULT_LAYER } from '../config/mapDefaults'

const VALID_LAYERS: IndicatorId[] = [
  'population',
  'density',
  'pct_0_14',
  'pct_15_64',
  'pct_65_plus',
  'pct_male',
  'pct_female',
  'sex_ratio',
  'pct_0_5',
  'pct_6_14',
  'pct_15_17',
  'pct_18_24',
  'pct_25_34',
  'pct_35_44',
  'pct_45_54',
  'pct_55_64',
  'pct_65_79',
  'pct_80_plus',
  'aging_index',
  'dependency_ratio',
  'elderly_dependency',
  'youth_dependency',
]

/**
 * Default map state
 */
export const DEFAULT_MAP_STATE: MapState = {
  lat: CITY_COORDS[DEFAULT_CITY_ID].center[1],
  lng: CITY_COORDS[DEFAULT_CITY_ID].center[0],
  zoom: CITY_COORDS[DEFAULT_CITY_ID].zoom,
  layer: DEFAULT_LAYER,
  areaId: null,
}

/**
 * Parse URL search params into MapState
 */
export function parseUrlState(searchParams: URLSearchParams): MapState {
  const lat = parseFloat(searchParams.get('lat') ?? '')
  const lng = parseFloat(searchParams.get('lng') ?? '')
  const zoom = parseFloat(searchParams.get('z') ?? '')
  const layer = searchParams.get('layer') as IndicatorId | null
  const areaId = searchParams.get('area')

  return {
    lat: isNaN(lat) ? DEFAULT_MAP_STATE.lat : lat,
    lng: isNaN(lng) ? DEFAULT_MAP_STATE.lng : lng,
    zoom: isNaN(zoom) ? DEFAULT_MAP_STATE.zoom : zoom,
    layer: layer && VALID_LAYERS.includes(layer) ? layer : DEFAULT_MAP_STATE.layer,
    areaId: areaId ?? null,
  }
}

/**
 * Serialize MapState to URL search params
 */
export function serializeUrlState(state: Partial<MapState>): URLSearchParams {
  const params = new URLSearchParams()

  if (state.lat !== undefined) {
    params.set('lat', state.lat.toFixed(4))
  }
  if (state.lng !== undefined) {
    params.set('lng', state.lng.toFixed(4))
  }
  if (state.zoom !== undefined) {
    params.set('z', state.zoom.toFixed(1))
  }
  if (state.layer !== undefined) {
    params.set('layer', state.layer)
  }
  if (state.areaId !== undefined && state.areaId !== null) {
    params.set('area', state.areaId)
  }

  return params
}

/**
 * Build shareable URL with current state
 */
export function buildShareableUrl(state: MapState): string {
  const params = serializeUrlState(state)
  const base = window.location.origin + window.location.pathname
  return `${base}?${params.toString()}`
}

