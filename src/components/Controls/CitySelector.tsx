import { useAppStore } from '@/store/appStore'
import type { CityId } from '@/types'

type CityInfo = {
  id: CityId
  name: string
  icon: string
  population: string
  districts: number
}

const CITIES: Record<CityId, CityInfo> = {
  berlin: {
    id: 'berlin',
    name: 'Berlin',
    icon: '🏛️',
    population: '3.8M',
    districts: 542,
  },
  hamburg: {
    id: 'hamburg',
    name: 'Hamburg',
    icon: '⚓',
    population: '1.9M',
    districts: 104,
  },
  munich: {
    id: 'munich',
    name: 'München',
    icon: '🍺',
    population: '1.5M',
    districts: 25,
  },
}

export function CitySelector() {
  const cityId = useAppStore((s) => s.cityId)
  const setCityId = useAppStore((s) => s.setCityId)

  return (
    <div className="glass-panel flex gap-1 p-1">
      {Object.values(CITIES).map((city) => (
        <button
          key={city.id}
            onClick={() => {
              setCityId(city.id)
            }}
          className={`
            flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all
            ${
              cityId === city.id
                ? 'bg-accent-primary/20 text-accent-primary shadow-sm'
                : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
            }
          `}
            title={`${city.name} - ${city.population} people, ${String(city.districts)} districts`}
        >
          <span className="text-lg">{city.icon}</span>
          <div className="hidden text-left sm:block">
            <div className="font-semibold">{city.name}</div>
            <div className="text-xs opacity-75">{city.districts} areas</div>
          </div>
        </button>
      ))}
    </div>
  )
}


