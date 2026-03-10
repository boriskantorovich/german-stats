import { INDICATORS } from '../../data/metadata'
import type { IndicatorId } from '../../types'

interface StatBlockProps {
  indicator: IndicatorId
  value: number
  percentile: number
}

export function StatBlock({ indicator, value, percentile }: StatBlockProps) {
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


