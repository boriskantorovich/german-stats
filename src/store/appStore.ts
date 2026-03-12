import { create } from 'zustand'
import type { MapRef } from 'react-map-gl/maplibre'
import type { AdminLevel, IndicatorId, TooltipData, CityId } from '../types'
import { CITY_COORDS, DEFAULT_CITY_ID, DEFAULT_LAYER } from '../config/mapDefaults'
import { CITY_AVAILABLE_INDICATORS } from '../data/cityLayers'

interface AppState {
  // Selected city
  cityId: CityId
  setCityId: (id: CityId) => void

  // Admin level (Planungsraum or Bezirk)
  adminLevel: AdminLevel
  setAdminLevel: (level: AdminLevel) => void

  // Selected area
  selectedAreaId: string | null
  setSelectedAreaId: (id: string | null) => void

  // Hovered area
  hoveredAreaId: string | null
  setHoveredAreaId: (id: string | null) => void

  // Active layer/indicator
  activeLayer: IndicatorId
  setActiveLayer: (layer: IndicatorId) => void

  // Tooltip
  tooltip: TooltipData | null
  setTooltip: (data: TooltipData | null) => void

  // UI state
  isCardOpen: boolean
  setIsCardOpen: (open: boolean) => void

  // Mobile sheet
  isMobileSheetOpen: boolean
  setIsMobileSheetOpen: (open: boolean) => void

  // Map reference for programmatic control
  mapRef: MapRef | null
  setMapRef: (ref: MapRef | null) => void
  flyToLocation: (lng: number, lat: number, zoom?: number) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // Selected city
  cityId: DEFAULT_CITY_ID,
  setCityId: (id) => {
    const { mapRef, activeLayer } = get()

    // Ensure the active indicator is valid for the new city.
    const availableIndicators = CITY_AVAILABLE_INDICATORS[id]
    const nextLayer: IndicatorId =
      availableIndicators?.includes(activeLayer)
        ? activeLayer
        : (availableIndicators && availableIndicators[0]) || DEFAULT_LAYER

    set({
      cityId: id,
      selectedAreaId: null,
      hoveredAreaId: null,
      isCardOpen: false,
      activeLayer: nextLayer,
    })

    // Fly to city center
    const coords = CITY_COORDS[id]
    if (mapRef) {
      mapRef.flyTo({
        center: coords.center,
        zoom: coords.zoom,
        duration: 2000,
        essential: true,
      })
    }
  },

  // Admin level (Planungsraum or Bezirk)
  adminLevel: 'planungsraum',
  setAdminLevel: (level) => {
    set({
      adminLevel: level,
      selectedAreaId: null,
      hoveredAreaId: null,
      isCardOpen: false,
    })
  },

  // Selected area
  selectedAreaId: null,
  setSelectedAreaId: (id) => {
    set({ selectedAreaId: id, isCardOpen: id !== null })
  },

  // Hovered area
  hoveredAreaId: null,
  setHoveredAreaId: (id) => {
    set({ hoveredAreaId: id })
  },

  // Active layer/indicator
  activeLayer: DEFAULT_LAYER,
  setActiveLayer: (layer) => {
    set({ activeLayer: layer })
  },

  // Tooltip
  tooltip: null,
  setTooltip: (data) => {
    set({ tooltip: data })
  },

  // UI state
  isCardOpen: false,
  setIsCardOpen: (open) => {
    set({ isCardOpen: open })
  },

  // Mobile sheet
  isMobileSheetOpen: false,
  setIsMobileSheetOpen: (open) => {
    set({ isMobileSheetOpen: open })
  },

  // Map reference for programmatic control
  mapRef: null,
  setMapRef: (ref) => {
    set({ mapRef: ref })
  },
  flyToLocation: (lng, lat, zoom = 15) => {
    const { mapRef } = get()
    if (mapRef) {
      mapRef.flyTo({
        center: [lng, lat],
        zoom,
        duration: 1500,
        essential: true,
      })
    }
  },
}))

