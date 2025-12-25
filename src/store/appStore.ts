import { create } from 'zustand'
import type { MapRef } from 'react-map-gl/maplibre'
import type { AdminLevel, IndicatorId, TooltipData } from '../types'

interface AppState {
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
  // Admin level (Planungsraum or Bezirk)
  adminLevel: 'planungsraum',
  setAdminLevel: (level) => set({ 
    adminLevel: level, 
    selectedAreaId: null, 
    hoveredAreaId: null,
    isCardOpen: false 
  }),

  // Selected area
  selectedAreaId: null,
  setSelectedAreaId: (id) => set({ selectedAreaId: id, isCardOpen: id !== null }),

  // Hovered area
  hoveredAreaId: null,
  setHoveredAreaId: (id) => set({ hoveredAreaId: id }),

  // Active layer/indicator
  activeLayer: 'density',
  setActiveLayer: (layer) => set({ activeLayer: layer }),

  // Tooltip
  tooltip: null,
  setTooltip: (data) => set({ tooltip: data }),

  // UI state
  isCardOpen: false,
  setIsCardOpen: (open) => set({ isCardOpen: open }),

  // Mobile sheet
  isMobileSheetOpen: false,
  setIsMobileSheetOpen: (open) => set({ isMobileSheetOpen: open }),

  // Map reference for programmatic control
  mapRef: null,
  setMapRef: (ref) => set({ mapRef: ref }),
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

