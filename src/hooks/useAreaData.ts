import { useQuery } from '@tanstack/react-query'
import type { ProfilesData, ProcessedArea, BerlinStats } from '../types'

const PROFILES_URL = '/data/profiles/index.json'

/**
 * Fetch all profiles data
 */
async function fetchProfiles(): Promise<ProfilesData> {
  const response = await fetch(PROFILES_URL)
  if (!response.ok) {
    throw new Error(`Failed to fetch profiles: ${response.statusText}`)
  }
  return response.json() as Promise<ProfilesData>
}

/**
 * Hook to fetch and cache all area profiles
 */
export function useProfilesData() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: fetchProfiles,
    staleTime: Infinity, // Data doesn't change during session
  })
}

/**
 * Hook to get a specific area's profile
 */
export function useAreaProfile(areaId: string | null) {
  const { data: profiles, isLoading, error } = useProfilesData()

  const area: ProcessedArea | undefined =
    areaId && profiles?.areas ? profiles.areas[areaId] : undefined

  return {
    data: area,
    isLoading,
    error,
  }
}

/**
 * Hook to get Berlin-wide statistics
 */
export function useBerlinStats() {
  const { data: profiles, isLoading, error } = useProfilesData()

  return {
    data: profiles?.berlin_stats as BerlinStats | undefined,
    isLoading,
    error,
  }
}

/**
 * Hook to get all areas for a specific indicator
 */
export function useIndicatorValues(indicator: string) {
  const { data: profiles, isLoading } = useProfilesData()

  const values: Record<string, number> = {}

  if (profiles?.areas) {
    for (const [id, area] of Object.entries(profiles.areas)) {
      const value = area[indicator as keyof ProcessedArea]
      if (typeof value === 'number') {
        values[id] = value
      }
    }
  }

  return {
    values,
    isLoading,
  }
}

