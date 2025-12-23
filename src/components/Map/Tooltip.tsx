import { useAppStore } from '../../store/appStore'
import { useLayerConfig } from '../../hooks/useLayerConfig'
import { useProfilesData } from '../../hooks/useAreaData'

export function Tooltip() {
  const tooltip = useAppStore((s) => s.tooltip)
  const { indicator, indicatorMeta } = useLayerConfig()
  const { data: profiles } = useProfilesData()

  if (!tooltip) return null

  // Get the actual value for the current indicator
  const area = profiles?.areas[tooltip.areaId]
  const value = area?.[indicator as keyof typeof area]
  const formattedValue =
    typeof value === 'number' ? indicatorMeta.format(value) : 'No data'

  return (
    <div
      className="pointer-events-none absolute z-50 glass-panel px-3 py-2 text-sm"
      style={{
        left: tooltip.x + 12,
        top: tooltip.y - 12,
        transform: 'translateY(-100%)',
      }}
    >
      <div className="font-semibold text-text-primary">{tooltip.name}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-text-secondary">{indicatorMeta.label}:</span>
        <span className="font-mono text-accent-primary">{formattedValue}</span>
      </div>
    </div>
  )
}

