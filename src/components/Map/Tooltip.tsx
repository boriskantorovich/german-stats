import { useAppStore } from '@/store/appStore'
import { useLayerConfig } from '@/hooks/useLayerConfig'
import { useProfilesData, useBezirkeProfilesData } from '@/hooks/useAreaData'

export function Tooltip() {
  const tooltip = useAppStore((s) => s.tooltip)
  const adminLevel = useAppStore((s) => s.adminLevel)
  const { indicator, indicatorMeta } = useLayerConfig()
  const { data: profiles } = useProfilesData()
  const { data: bezirkeProfiles } = useBezirkeProfilesData()

  if (!tooltip) return null

  // Get the actual value for the current indicator based on admin level
  let value: number | undefined
  
  if (adminLevel === 'bezirk') {
    const bezirk = bezirkeProfiles?.bezirke[tooltip.areaId]
    value = bezirk?.[indicator as keyof typeof bezirk] as number | undefined
  } else {
    const area = profiles?.areas[tooltip.areaId]
    value = area?.[indicator as keyof typeof area] as number | undefined
  }
  
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
