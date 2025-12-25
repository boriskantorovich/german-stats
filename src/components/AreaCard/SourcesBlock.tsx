import { INDICATORS } from '../../data/metadata'
import type { IndicatorId } from '../../types'

interface SourcesBlockProps {
  indicators: IndicatorId[]
}

export function SourcesBlock({ indicators }: SourcesBlockProps) {
  // Get unique sources from indicators
  const sources = Array.from(
    new Set(indicators.map((ind) => INDICATORS[ind].source))
  )

  const firstIndicator = indicators[0]
  const referenceDate = firstIndicator ? INDICATORS[firstIndicator].referenceDate : ''

  return (
    <div className="pt-3 border-t border-border-subtle space-y-2">
      <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
        Data Sources
      </h4>
      <div className="text-xs text-text-secondary space-y-1">
        {sources.map((source, i) => (
          <p key={i}>{source}</p>
        ))}
        {referenceDate && (
          <p className="text-text-secondary/70">
            Reference date: {formatDate(referenceDate)}
          </p>
        )}
      </div>
      <p className="text-xs text-text-secondary/70">
        License: CC BY · Amt für Statistik Berlin-Brandenburg
      </p>
    </div>
  )
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

