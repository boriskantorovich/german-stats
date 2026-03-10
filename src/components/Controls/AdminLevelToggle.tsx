import { useAppStore } from '../../store/appStore'
import type { AdminLevel } from '../../types'

const LEVELS: { id: AdminLevel; label: string; labelDe: string }[] = [
  { id: 'planungsraum', label: 'Neighborhoods', labelDe: 'Planungsräume' },
  { id: 'bezirk', label: 'Districts', labelDe: 'Bezirke' },
]

export function AdminLevelToggle() {
  const adminLevel = useAppStore((s) => s.adminLevel)
  const setAdminLevel = useAppStore((s) => s.setAdminLevel)

  return (
    <div className="glass-panel p-1 flex gap-1">
      {LEVELS.map((level) => (
        <button
          key={level.id}
          onClick={() => setAdminLevel(level.id)}
          className={`
            px-3 py-1.5 text-sm font-medium rounded transition-all
            ${
              adminLevel === level.id
                ? 'bg-accent-primary text-white'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated/50'
            }
          `}
          title={level.labelDe}
        >
          {level.label}
        </button>
      ))}
    </div>
  )
}


