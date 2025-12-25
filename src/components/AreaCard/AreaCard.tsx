import { useAreaProfile, useBerlinStats } from '../../hooks/useAreaData'
import { useMapState } from '../../hooks/useMapState'
import { DISPLAY_INDICATORS, INDICATORS } from '../../data/metadata'
import { StatBlock } from './StatBlock'
import { PercentileBar } from './PercentileBar'
import { ComparisonTable } from './ComparisonTable'
import { SourcesBlock } from './SourcesBlock'
import type { ProcessedArea, IndicatorId } from '../../types'

interface AreaCardProps {
  areaId: string
}

export function AreaCard({ areaId }: AreaCardProps) {
  const { data: profile, isLoading, error } = useAreaProfile(areaId)
  const { data: berlinStats } = useBerlinStats()
  const { setSelectedArea } = useMapState()

  if (isLoading) {
    return <CardSkeleton />
  }

  if (error || !profile) {
    return (
      <div className="glass-panel p-4">
        <p className="text-text-secondary">Unable to load area data</p>
        <button
          className="mt-2 text-sm text-accent-primary hover:underline"
          onClick={() => setSelectedArea(null)}
        >
          Close
        </button>
      </div>
    )
  }

  return (
    <aside className="glass-panel p-4 space-y-4">
      {/* Header */}
      <header className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-display font-semibold text-text-primary">
            Planungsraum {profile.PLR_ID}
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            District {profile.PLR_ID.slice(0, 2)}
          </p>
        </div>
        <button
          className="text-text-secondary hover:text-text-primary transition-colors p-1"
          onClick={() => setSelectedArea(null)}
          aria-label="Close area card"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 gap-3">
        {DISPLAY_INDICATORS.map((ind) => (
          <StatBlock
            key={ind}
            indicator={ind}
            value={getIndicatorValue(profile, ind)}
            percentile={getPercentileValue(profile, ind)}
          />
        ))}
      </section>

      {/* Percentile Visualization */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
          Berlin Comparison
        </h3>
        <PercentileBar
          value={profile.density}
          percentile={profile.density_percentile}
          label="Density percentile"
          format={INDICATORS.density.format}
        />
      </section>

      {/* Comparison Table */}
      {berlinStats && (
        <section>
          <ComparisonTable
            area={profile}
            berlin={berlinStats}
            indicators={['population', 'density', 'pct_65_plus']}
          />
        </section>
      )}

      {/* Sources */}
      <SourcesBlock indicators={DISPLAY_INDICATORS} />
    </aside>
  )
}

function CardSkeleton() {
  return (
    <div className="glass-panel p-4 space-y-4 animate-pulse">
      <div>
        <div className="h-6 bg-bg-elevated rounded w-3/4" />
        <div className="h-4 bg-bg-elevated rounded w-1/2 mt-2" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-bg-elevated rounded-md p-3 h-20" />
        ))}
      </div>
      <div className="h-16 bg-bg-elevated rounded" />
      <div className="h-24 bg-bg-elevated rounded" />
    </div>
  )
}

function getIndicatorValue(profile: ProcessedArea, indicator: IndicatorId): number {
  const value = profile[indicator as keyof ProcessedArea]
  return typeof value === 'number' ? value : 0
}

function getPercentileValue(profile: ProcessedArea, indicator: IndicatorId): number {
  const key = `${indicator}_percentile` as keyof ProcessedArea
  const value = profile[key]
  return typeof value === 'number' ? value : 0
}

