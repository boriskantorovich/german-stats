import { INDICATORS } from '../../data/metadata'
import type { ProcessedArea, BerlinStats, IndicatorId } from '../../types'

interface ComparisonTableProps {
  area: ProcessedArea
  berlin: BerlinStats
  indicators: IndicatorId[]
}

export function ComparisonTable({ area, berlin, indicators }: ComparisonTableProps) {
  return (
    <div className="overflow-hidden rounded-md border border-white/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-bg-elevated/50">
            <th className="text-left px-3 py-2 text-text-secondary font-medium">Metric</th>
            <th className="text-right px-3 py-2 text-text-secondary font-medium">Area</th>
            <th className="text-right px-3 py-2 text-text-secondary font-medium">Berlin</th>
          </tr>
        </thead>
        <tbody>
          {indicators.map((ind) => {
            const meta = INDICATORS[ind]
            const areaValue = area[ind as keyof ProcessedArea]
            const berlinValue = getBerlinValue(berlin, ind)

            return (
              <tr key={ind} className="border-t border-white/5">
                <td className="px-3 py-2 text-text-secondary">{meta.label}</td>
                <td className="px-3 py-2 text-right font-mono text-text-primary">
                  {typeof areaValue === 'number' ? meta.format(areaValue) : 'N/A'}
                </td>
                <td className="px-3 py-2 text-right font-mono text-text-secondary">
                  {berlinValue !== null ? meta.format(berlinValue) : 'N/A'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function getBerlinValue(berlin: BerlinStats, indicator: IndicatorId): number | null {
  switch (indicator) {
    case 'population':
      return berlin.population
    case 'density':
      return berlin.density_median
    case 'pct_0_14':
      return berlin.pct_0_14_median
    case 'pct_15_64':
      return berlin.pct_15_64_median
    case 'pct_65_plus':
      return berlin.pct_65_plus_median
    default:
      return null
  }
}

