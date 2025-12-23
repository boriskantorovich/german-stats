interface PercentileBarProps {
  value: number
  percentile: number
  label: string
  format: (v: number) => string
}

export function PercentileBar({ percentile, label, format, value }: PercentileBarProps) {
  const clampedPercentile = Math.max(0, Math.min(100, percentile))

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-text-secondary">
        <span>{label}</span>
        <span className="font-mono">{format(value)}</span>
      </div>

      <div className="relative h-6 bg-bg-elevated rounded-full overflow-hidden">
        {/* Track marks */}
        <div className="absolute inset-0 flex justify-between px-2 items-center pointer-events-none">
          <span className="w-px h-3 bg-white/10" />
          <span className="w-px h-3 bg-white/10" />
          <span className="w-px h-3 bg-white/10" />
          <span className="w-px h-3 bg-white/10" />
          <span className="w-px h-3 bg-white/10" />
        </div>

        {/* Fill */}
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent-primary/60 to-accent-primary rounded-full transition-all duration-300"
          style={{ width: `${clampedPercentile}%` }}
        />

        {/* Marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-300"
          style={{ left: `${clampedPercentile}%` }}
        >
          <div className="w-4 h-4 bg-accent-primary rounded-full border-2 border-bg-primary shadow-lg" />
        </div>
      </div>

      <div className="flex justify-between text-xs text-text-secondary">
        <span>0th</span>
        <span className="text-accent-primary font-semibold">
          {Math.round(percentile)}th
        </span>
        <span>100th</span>
      </div>
    </div>
  )
}

