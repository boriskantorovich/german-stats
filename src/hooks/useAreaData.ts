import { useQuery } from '@tanstack/react-query'
import type { ProfilesData, ProcessedArea, BerlinStats, BezirkeProfilesData, BezirkData } from '../types'
import { useAppStore } from '../store/appStore'

const PROFILES_URL = '/data/profiles/index.json'
const BEZIRKE_PROFILES_URL = '/data/profiles/bezirke.json'

/**
 * Fetch all Planungsraum profiles data
 */
async function fetchProfiles(): Promise<ProfilesData> {
  const response = await fetch(PROFILES_URL)
  if (!response.ok) {
    throw new Error(`Failed to fetch profiles: ${response.statusText}`)
  }
  return response.json() as Promise<ProfilesData>
}

/**
 * Fetch all Bezirke profiles data
 */
async function fetchBezirkeProfiles(): Promise<BezirkeProfilesData> {
  const response = await fetch(BEZIRKE_PROFILES_URL)
  if (!response.ok) {
    throw new Error(`Failed to fetch Bezirke profiles: ${response.statusText}`)
  }
  return response.json() as Promise<BezirkeProfilesData>
}

/**
 * Hook to fetch and cache all Planungsraum profiles
 */
export function useProfilesData() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: fetchProfiles,
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
