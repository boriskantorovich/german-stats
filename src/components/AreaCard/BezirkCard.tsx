import { useBezirkProfile } from '../../hooks/useAreaData'
import { useMapState } from '../../hooks/useMapState'
import { INDICATORS } from '../../data/metadata'
import { PercentileBar } from './PercentileBar'
import { SourcesBlock } from './SourcesBlock'
import type { BezirkData, IndicatorId } from '../../types'

interface BezirkCardProps {
  bezirkId: string
}

// Indicators to display for Bezirke
const BEZIRK_INDICATORS: IndicatorId[] = ['population', 'density', 'pct_0_14', 'pct_65_plus']

export function BezirkCard({ bezirkId }: BezirkCardProps) {
  const { data: profile, isLoading, error } = useBezirkProfile(bezirkId)
  const { setSelectedArea } = useMapState()

  if (isLoading) {
    return <CardSkeleton />
  }

  if (error || !profile) {
    return (
      <div className="glass-panel p-4">
        <p className="text-text-secondary">Unable to load district data</p>
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
            {profile.BEZ_NAME}
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            District {profile.BEZ_ID} · {profile.planungsraeume_count} neighborhoods
          </p>
        </div>
        <button
          className="text-text-secondary hover:text-text-primary transition-colors p-1"
          onClick={() => setSelectedArea(null)}
          aria-label="Close district card"
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
        {BEZIRK_INDICATORS.map((ind) => (
          <BezirkStatBlock
            key={ind}
            indicator={ind}
            value={getIndicatorValue(profile, ind)}
            percentile={getPercentileValue(profile, ind)}
          />
        ))}
      </section>

      {/* Gender breakdown */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
          Gender Distribution
        </h3>
        <div className="flex gap-4 text-sm">
          <div className="flex-1 bg-bg-elevated/50 rounded-md p-3">
            <div className="text-text-secondary">Male</div>
            <div className="font-mono text-lg text-text-primary">
              {profile.pct_male.toFixed(1)}%
            </div>
            <div className="text-xs text-text-secondary">
              {profile.pop_male.toLocaleString('de-DE')}
            </div>
          </div>
          <div className="flex-1 bg-bg-elevated/50 rounded-md p-3">
            <div className="text-text-secondary">Female</div>
            <div className="font-mono text-lg text-text-primary">
              {profile.pct_female.toFixed(1)}%
            </div>
            <div className="text-xs text-text-secondary">
              {profile.pop_female.toLocaleString('de-DE')}
            </div>
          </div>
        </div>
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

      {/* Area info */}
      <section className="text-sm text-text-secondary space-y-1">
        <p>
          <span className="font-medium">Area:</span>{' '}
          {profile.area_km2.toFixed(1)} km²
        </p>
        <p>
          <span className="font-medium">Neighborhoods:</span>{' '}
          {profile.planungsraeume_count} Planungsräume
        </p>
      </section>

      {/* Sources */}
      <SourcesBlock indicators={BEZIRK_INDICATORS} />
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

interface BezirkStatBlockProps {
  indicator: IndicatorId
  value: number
  percentile: number
}

function BezirkStatBlock({ indicator, value, percentile }: BezirkStatBlockProps) {
  const meta = INDICATORS[indicator]

  return (
    <div className="bg-bg-elevated/50 rounded-md p-3">
      <div className="text-xs text-text-secondary mb-1">{meta.label}</div>
      <div className="font-mono text-lg text-text-primary font-semibold">
        {meta.format(value)}
      </div>
      <div className="text-xs text-text-secondary mt-1">
        {Math.round(percentile)}th percentile
      </div>
    </div>
  )
}

function getIndicatorValue(profile: BezirkData, indicator: IndicatorId): number {
  const value = profile[indicator as keyof BezirkData]
  return typeof value === 'number' ? value : 0
}

function getPercentileValue(profile: BezirkData, indicator: IndicatorId): number {
  const key = `${indicator}_percentile` as keyof BezirkData
  const value = profile[key]
  return typeof value === 'number' ? value : 0
}

