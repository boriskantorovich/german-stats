import { useQuery } from '@tanstack/react-query'
import type { ProfilesData, ProcessedArea, BezirkeProfilesData, BezirkData, CityId } from '../types'
import { useAppStore } from '../store/appStore'

// Profile URLs by city
const PROFILES_URLS = {
  berlin: '/data/profiles/berlin.json',
  hamburg: '/data/profiles/hamburg.json',
  munich: '/data/profiles/munich.json',
} as const

const BEZIRKE_PROFILES_URL = '/data/profiles/bezirke.json'

/**
 * Fetch all area profiles data for a specific city
 */
async function fetchProfiles(cityId: CityId): Promise<ProfilesData> {
  const url = PROFILES_URLS[cityId]
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch profiles: ${response.statusText}`)
  }
  return response.json() as Promise<ProfilesData>
}

/**
 * Fetch all Bezirke profiles data (Berlin only)
 */
async function fetchBezirkeProfiles(): Promise<BezirkeProfilesData> {
  const response = await fetch(BEZIRKE_PROFILES_URL)
  if (!response.ok) {
    throw new Error(`Failed to fetch Bezirke profiles: ${response.statusText}`)
  }
  return response.json() as Promise<BezirkeProfilesData>
}

/**
 * Hook to fetch and cache all area profiles for the current city
 */
export function useProfilesData() {
  const cityId = useAppStore((s) => s.cityId)
  
  return useQuery({
    queryKey: ['profiles', cityId],
    queryFn: () => fetchProfiles(cityId),
    staleTime: Infinity, // Data doesn't change during session
  })
}

/**
 * Hook to fetch and cache all Bezirke profiles
 */
export function useBezirkeProfilesData() {
  return useQuery({
    queryKey: ['bezirke-profiles'],
    queryFn: fetchBezirkeProfiles,
    staleTime: Infinity, // Data doesn't change during session
  })
}

/**
 * Hook to get a specific Planungsraum profile
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
 * Hook to get a specific Bezirk profile
 */
export function useBezirkProfile(bezirkId: string | null) {
  const { data: profiles, isLoading, error } = useBezirkeProfilesData()

  const bezirk: BezirkData | undefined =
    bezirkId && profiles?.bezirke ? profiles.bezirke[bezirkId] : undefined

  return {
    data: bezirk,
    isLoading,
    error,
  }
}

/**
 * Hook to get the current area profile based on admin level
 */
export function useCurrentAreaProfile(areaId: string | null) {
  const adminLevel = useAppStore((s) => s.adminLevel)
  
  const planungsraumResult = useAreaProfile(adminLevel === 'planungsraum' ? areaId : null)
  const bezirkResult = useBezirkProfile(adminLevel === 'bezirk' ? areaId : null)
  
  if (adminLevel === 'bezirk') {
    return {
      data: bezirkResult.data,
      isLoading: bezirkResult.isLoading,
      error: bezirkResult.error,
      adminLevel,
    }
  }
  
  return {
    data: planungsraumResult.data,
    isLoading: planungsraumResult.isLoading,
    error: planungsraumResult.error,
    adminLevel,
  }
}

/**
 * Hook to get Berlin-wide statistics
 */
export function useBerlinStats() {
  const { data: profiles, isLoading, error } = useProfilesData()

  return {
    data: profiles?.berlin_stats,
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
