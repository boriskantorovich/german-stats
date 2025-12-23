import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { parseUrlState, DEFAULT_MAP_STATE } from '../lib/url'
import type { MapState, IndicatorId } from '../types'

/**
 * Hook to sync map state with URL search params
 */
export function useMapState() {
  const [searchParams, setSearchParams] = useSearchParams()

  const mapState = useMemo(() => parseUrlState(searchParams), [searchParams])

  const updateState = useCallback(
    (updates: Partial<MapState>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)

          if (updates.lat !== undefined) {
            next.set('lat', updates.lat.toFixed(4))
          }
          if (updates.lng !== undefined) {
            next.set('lng', updates.lng.toFixed(4))
          }
          if (updates.zoom !== undefined) {
            next.set('z', updates.zoom.toFixed(1))
          }
          if (updates.layer !== undefined) {
            next.set('layer', updates.layer)
          }
          if (updates.areaId !== undefined) {
            if (updates.areaId === null) {
              next.delete('area')
            } else {
              next.set('area', updates.areaId)
            }
          }

          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const setViewport = useCallback(
    (lat: number, lng: number, zoom: number) => {
      updateState({ lat, lng, zoom })
    },
    [updateState]
  )

  const setLayer = useCallback(
    (layer: IndicatorId) => {
      updateState({ layer })
    },
    [updateState]
  )

  const setSelectedArea = useCallback(
    (areaId: string | null) => {
      updateState({ areaId })
    },
    [updateState]
  )

  const resetToDefault = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true })
  }, [setSearchParams])

  return {
    mapState,
    updateState,
    setViewport,
    setLayer,
    setSelectedArea,
    resetToDefault,
    defaultState: DEFAULT_MAP_STATE,
  }
}

