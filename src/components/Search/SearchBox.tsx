import { useState, useCallback, useRef, useEffect } from 'react'
import clsx from 'clsx'

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
  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<number>()

  const search = useCallback(async (q: string) => {
    if (!q.trim() || !STADIA_KEY) {
      setResults([])
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(
        `https://api.stadiamaps.com/geocoding/v1/autocomplete?` +
          `text=${encodeURIComponent(q)}&` +
          `focus.point.lat=52.52&focus.point.lon=13.405&` +
          `boundary.country=DE&` +
          `layers=address,venue,street&` +
          `api_key=${STADIA_KEY}`
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

  const selectResult = (_result: SearchResult) => {
    // For now, just close the dropdown
    // Full implementation would fly to location and select LOR area
    setQuery('')
    setResults([])
    setIsOpen(false)
  }

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
        <ul className="absolute top-full left-0 right-0 mt-2 glass-panel py-1 max-h-64 overflow-y-auto">
          {results.map((result) => (
            <li key={result.properties.id}>
              <button
                className={clsx(
                  'w-full text-left px-3 py-2 text-sm transition-colors',
                  'hover:bg-white/5 text-text-primary'
                )}
                onClick={() => selectResult(result)}
              >
                {result.properties.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* No API key warning */}
      {!STADIA_KEY && isOpen && query.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-panel p-3 text-xs text-text-secondary">
          Search requires a Stadia Maps API key. Add VITE_STADIA_API_KEY to your .env file.
        </div>
      )}
    </div>
  )
}

