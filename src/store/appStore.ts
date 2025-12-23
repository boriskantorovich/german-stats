import { create } from 'zustand'
import type { IndicatorId, TooltipData } from '../types'

interface AppState {
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
}

export const useAppStore = create<AppState>((set) => ({
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
}))

