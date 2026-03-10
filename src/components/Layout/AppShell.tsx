import { useEffect } from 'react'
import { MapContainer } from '@/components/Map/MapContainer'
import { AreaCard } from '@/components/AreaCard/AreaCard'
import { BezirkCard } from '@/components/AreaCard/BezirkCard'
import { MobileSheet } from '@/components/Layout/MobileSheet'
import { SearchBox } from '@/components/Search/SearchBox'
import { LayerSwitcher } from '@/components/Map/LayerSwitcher'
import { Legend } from '@/components/Map/Legend'
import { ShareButton } from '@/components/Controls/ShareButton'
import { ThemeToggle } from '@/components/Controls/ThemeToggle'
import { AdminLevelToggle } from '@/components/Controls/AdminLevelToggle'
import { CitySelector } from '@/components/Controls/CitySelector'
import { useAppStore } from '@/store/appStore'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useMapState } from '@/hooks/useMapState'

export function AppShell() {
  const selectedAreaId = useAppStore((s) => s.selectedAreaId)
  const adminLevel = useAppStore((s) => s.adminLevel)
  const activeLayer = useAppStore((s) => s.activeLayer)
  const cityId = useAppStore((s) => s.cityId)
  const setActiveLayer = useAppStore((s) => s.setActiveLayer)
  const isMobile = useMediaQuery('(max-width: 768px)')
  const { mapState } = useMapState()

  // Only Berlin has multiple admin levels
  const showAdminToggle = cityId === 'berlin'

  // Sync URL layer param with store
  useEffect(() => {
    if (mapState.layer && mapState.layer !== activeLayer) {
      setActiveLayer(mapState.layer)
    }
  }, [mapState.layer, activeLayer, setActiveLayer])

  // Render the appropriate card based on admin level
  const renderCard = () => {
    if (!selectedAreaId) return null
    
    if (adminLevel === 'bezirk') {
      return <BezirkCard bezirkId={selectedAreaId} />
    }
    return <AreaCard areaId={selectedAreaId} />
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Map fills the entire viewport */}
      <MapContainer />

      {/* Controls overlay - top left */}
      <div className="absolute left-4 top-4 z-10 flex flex-col gap-3">
        <CitySelector />
        <SearchBox />
        {showAdminToggle && <AdminLevelToggle />}
        <LayerSwitcher />
      </div>

      {/* Legend - bottom left */}
      <div className="absolute bottom-6 left-4 z-10">
        <Legend />
      </div>

      {/* Controls - top right */}
      <div className="absolute right-4 top-4 z-10 flex gap-2">
        <ThemeToggle />
        <ShareButton />
      </div>

      {/* Area Card - desktop sidebar */}
      {!isMobile && selectedAreaId && (
        <div className="absolute right-4 top-16 z-10 w-96 max-h-[calc(100vh-5rem)] overflow-y-auto">
          {renderCard()}
        </div>
      )}

      {/* Area Card - mobile bottom sheet */}
      {isMobile && selectedAreaId && (
        <MobileSheet open={!!selectedAreaId}>
          {renderCard()}
        </MobileSheet>
      )}

      {/* Attribution footer */}
      <div className="absolute bottom-2 right-2 z-10 text-xs text-text-secondary opacity-70">
        Data: Amt für Statistik Berlin-Brandenburg · CC BY
      </div>
    </div>
  )
}

