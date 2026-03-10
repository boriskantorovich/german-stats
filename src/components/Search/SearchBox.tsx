import { useState, useCallback, useRef, useEffect } from 'react'
import clsx from 'clsx'
import { useAppStore } from '@/store/appStore'
import { useMapState } from '@/hooks/useMapState'

const STADIA_KEY = import.meta.env.VITE_STADIA_API_KEY as string | undefined

interface SearchResult {
  properties: {
    id: string
    label: string
    name: string
  }
  geometry: {
    coordinates: [number, number]
  }
}

export function SearchBox() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<number>()
  const flyToLocation = useAppStore((s) => s.flyToLocation)
  const { setSelectedArea } = useMapState()

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      setHasSearched(false)
      return
    }

    setIsLoading(true)
    setHasSearched(true)

    try {
      // Build URL with optional API key (not needed for localhost)
      const params = new URLSearchParams({
        text: q,
        'focus.point.lat': '52.52',
        'focus.point.lon': '13.405',
        'boundary.country': 'DE',
        layers: 'address,venue,street',
      })
      if (STADIA_KEY) {
        params.append('api_key', STADIA_KEY)
      }

      const response = await fetch(
        `https://api.stadiamaps.com/geocoding/v1/autocomplete?${params}`
      )

      if (!response.ok) throw new Error('Search failed')

      const data = (await response.json()) as { features?: SearchResult[] }
      setResults(data.features ?? [])
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setIsOpen(true)

    // Debounce search
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = window.setTimeout(() => {
      void search(value)
    }, 300)
  }

  const selectResult = useCallback(
    (result: SearchResult) => {
      const [lng, lat] = result.geometry.coordinates
      const mapRef = useAppStore.getState().mapRef

      if (!mapRef) return

      const map = mapRef.getMap()

      // Handler to query the area after map move completes
      const onMoveEnd = () => {
        // Give a small delay for tiles to render
        setTimeout(() => {
          const features = map.queryRenderedFeatures(map.project([lng, lat]), {
            layers: ['lor-fill'],
          })

          if (features && features.length > 0) {
            const firstFeature = features[0]
            const areaId =
              firstFeature && firstFeature.properties
                ? (firstFeature.properties.PLR_ID as string | undefined)
                : undefined

            if (areaId) {
              // Update URL state, which will sync to store
              setSelectedArea(areaId)
            }
          }
        }, 300)

        // Remove the listener
        map.off('moveend', onMoveEnd)
      }

      // Listen for when flyTo completes
      map.once('moveend', onMoveEnd)

      // Fly to the selected location
      flyToLocation(lng, lat, 16)

      // Clear and close search
      setQuery('')
      setResults([])
      setIsOpen(false)
      setHasSearched(false)
    },
    [flyToLocation, setSelectedArea]
  )

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="relative w-72" ref={inputRef}>
      <div className="glass-panel flex items-center gap-2 px-3 py-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-text-secondary flex-shrink-0"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search address in Berlin..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary focus:outline-none"
        />
        {isLoading && (
          <div className="w-4 h-4 border-2 border-text-secondary/30 border-t-accent-primary rounded-full animate-spin" />
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && results.length > 0 && (
        <ul className="absolute top-full left-0 right-0 mt-2 glass-panel py-1 max-h-64 overflow-y-auto z-50">
          {results.map((result) => (
            <li key={result.properties.id}>
              <button
                className={clsx(
                  'w-full text-left px-3 py-2 text-sm transition-colors',
                  'hover:bg-hover-bg text-text-primary'
                )}
                onClick={() => selectResult(result)}
              >
                {result.properties.label}
              </button>
            </li>
          ))}
        </ul>
      )}


      {/* Info about localhost */}
      {!STADIA_KEY && isOpen && query.length > 0 && results.length === 0 && !isLoading && hasSearched && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-panel p-3 text-xs text-text-secondary z-50">
          Note: Search works on localhost without an API key. For production, add VITE_STADIA_API_KEY to your .env file.
        </div>
      )}

    </div>
  )
}

