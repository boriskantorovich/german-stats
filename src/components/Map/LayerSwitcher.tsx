import clsx from 'clsx'
import { useAppStore } from '../../store/appStore'
import { LAYER_OPTIONS } from '../../data/metadata'
import type { IndicatorId } from '../../types'

export function LayerSwitcher() {
  const activeLayer = useAppStore((s) => s.activeLayer)
  const setActiveLayer = useAppStore((s) => s.setActiveLayer)

  return (
    <div className="glass-panel p-2">
      <div className="text-xs text-text-secondary mb-2 px-2">Data Layer</div>
      <div className="flex flex-col gap-1">
        {LAYER_OPTIONS.map((layer) => (
          <button
            key={layer.id}
            className={clsx(
              'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left',
              activeLayer === layer.id
                ? 'bg-accent-primary/20 text-accent-primary'
                : 'text-text-primary hover:bg-white/5'
            )}
            onClick={() => setActiveLayer(layer.id as IndicatorId)}
            aria-pressed={activeLayer === layer.id}
          >
            <span className="text-base">{layer.icon}</span>
            <span>{layer.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

