import { useLayerConfig } from '@/hooks/useLayerConfig'
import { NO_DATA_COLOR } from '@/data/layers'

export function Legend() {
  const { indicatorMeta, colorBreaks, isLoading } = useLayerConfig()

  if (isLoading) {
    return (
      <div className="glass-panel p-3 w-48 animate-pulse">
        <div className="h-4 bg-bg-elevated rounded w-3/4 mb-3" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-4 h-4 bg-bg-elevated rounded" />
              <div className="h-3 bg-bg-elevated rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Show fewer breaks on the legend for readability
  const displayBreaks = colorBreaks.filter((_, i) => i % 2 === 0 || i === colorBreaks.length - 1)

  return (
    <div className="glass-panel p-3 w-52">
      <h4 className="text-sm font-semibold text-text-primary mb-3">
        {indicatorMeta.label}
      </h4>

      {/* Color scale */}
      <div className="flex h-3 rounded overflow-hidden mb-2">
        {colorBreaks.map((b, i) => (
          <div
            key={i}
            className="flex-1"
            style={{ backgroundColor: b.color }}
          />
        ))}
      </div>

      {/* Labels */}
      <div className="flex justify-between text-xs text-text-secondary mb-3">
        <span>{indicatorMeta.format(colorBreaks[0]?.min ?? 0)}</span>
        <span>{indicatorMeta.format(colorBreaks[colorBreaks.length - 1]?.max ?? 0)}</span>
      </div>

      {/* Detailed breaks */}
      <div className="space-y-1.5">
        {displayBreaks.map((b, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span
              className="w-4 h-4 rounded flex-shrink-0"
              style={{ backgroundColor: b.color }}
            />
            <span className="text-text-secondary">
              {indicatorMeta.format(b.min)} – {indicatorMeta.format(b.max)}
            </span>
          </div>
        ))}
      </div>

      {/* No data indicator */}
      <div className="mt-3 pt-2 border-t border-border-subtle flex items-center gap-2 text-xs">
        <span
          className="w-4 h-4 rounded flex-shrink-0"
          style={{ backgroundColor: NO_DATA_COLOR }}
        />
        <span className="text-text-secondary">No data</span>
      </div>
    </div>
  )
}

