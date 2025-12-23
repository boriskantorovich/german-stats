/**
 * WFS Client for fetching LOR geometry from Berlin's GDI WFS service
 */

const WFS_BASE_URL = 'https://gdi.berlin.de/services/wfs/lor_2021'

export interface WFSOptions {
  typeName: string
  outputFormat?: string
  srsName?: string
  maxFeatures?: number
}

/**
 * Fetch GeoJSON from WFS endpoint
 */
export async function fetchWFS(options: WFSOptions): Promise<GeoJSON.FeatureCollection> {
  const {
    typeName,
    outputFormat = 'application/json',
    srsName = 'EPSG:4326',
    maxFeatures,
  } = options

  const params = new URLSearchParams({
    service: 'WFS',
    version: '2.0.0',
    request: 'GetFeature',
    typeNames: typeName,
    outputFormat,
    srsName,
  })

  if (maxFeatures) {
    params.set('count', maxFeatures.toString())
  }

  const url = `${WFS_BASE_URL}?${params.toString()}`
  console.log(`Fetching from WFS: ${url}`)

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`WFS request failed: ${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<GeoJSON.FeatureCollection>
}

/**
 * Fetch Planungsräume (finest granularity - 542 areas)
 */
export async function fetchPlanungsraeume(): Promise<GeoJSON.FeatureCollection> {
  return fetchWFS({
    typeName: 'lor_2021:a_lor_plr_2021',
  })
}

/**
 * Fetch Bezirksregionen (143 areas)
 */
export async function fetchBezirksregionen(): Promise<GeoJSON.FeatureCollection> {
  return fetchWFS({
    typeName: 'lor_2021:b_lor_bzr_2021',
  })
}

/**
 * Fetch Prognoseräume (58 areas)
 */
export async function fetchPrognoseräume(): Promise<GeoJSON.FeatureCollection> {
  return fetchWFS({
    typeName: 'lor_2021:c_lor_pgr_2021',
  })
}

