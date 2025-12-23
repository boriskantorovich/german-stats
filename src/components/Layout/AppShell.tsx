import { MapContainer } from '../Map/MapContainer'
import { AreaCard } from '../AreaCard/AreaCard'
import { MobileSheet } from './MobileSheet'
import { SearchBox } from '../Search/SearchBox'
import { LayerSwitcher } from '../Map/LayerSwitcher'
import { Legend } from '../Map/Legend'
import { ShareButton } from '../Controls/ShareButton'
import { useAppStore } from '../../store/appStore'
import { useMediaQuery } from '../../hooks/useMediaQuery'

export function AppShell() {
  const selectedAreaId = useAppStore((s) => s.selectedAreaId)
  const isMobile = useMediaQuery('(max-width: 768px)')

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Map fills the entire viewport */}
      <MapContainer />

      {/* Controls overlay - top left */}
      <div className="absolute left-4 top-4 z-10 flex flex-col gap-3">
        <SearchBox />
        <LayerSwitcher />
      </div>

      {/* Legend - bottom left */}
      <div className="absolute bottom-6 left-4 z-10">
        <Legend />
      </div>

      {/* Share button - top right */}
      <div className="absolute right-4 top-4 z-10">
        <ShareButton />
      </div>

      {/* Area Card - desktop sidebar */}
      {!isMobile && selectedAreaId && (
        <div className="absolute right-4 top-16 z-10 w-96 max-h-[calc(100vh-5rem)] overflow-y-auto">
          <AreaCard areaId={selectedAreaId} />
        </div>
      )}

      {/* Area Card - mobile bottom sheet */}
      {isMobile && selectedAreaId && (
        <MobileSheet open={!!selectedAreaId}>
          <AreaCard areaId={selectedAreaId} />
        </MobileSheet>
      )}

      {/* Attribution footer */}
      <div className="absolute bottom-2 right-2 z-10 text-xs text-text-secondary opacity-70">
        Data: Amt für Statistik Berlin-Brandenburg · CC BY
      </div>
    </div>
  )
}

