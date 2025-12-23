/**
 * Script to join geometry with demographics and compute derived values
 * 
 * Run with: npx tsx scripts/03-process-data.ts
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { parseCSV, csvToObjects, parseGermanNumber } from './lib/csv-parser'

const INPUT_GEOMETRY = 'data/raw/lor-planungsraeume.geojson'
const INPUT_DEMOGRAPHICS = 'data/raw/population-2024.csv'
const OUTPUT_DIR = 'data/processed'
const OUTPUT_GEOJSON = `${OUTPUT_DIR}/lor-with-data.geojson`
const OUTPUT_PROFILES = 'public/data/profiles/index.json'

interface DemographicRow {
  RAUMID: string
  // Add other columns as discovered from the actual CSV
  [key: string]: string
}

interface ProcessedArea {
  PLR_ID: string
  PLR_NAME: string
  BZR_ID: string
  BZR_NAME: string
  BEZ_ID: string
  BEZ_NAME: string
  population: number
  area_km2: number
  pop_0_14: number
  pop_15_64: number
  pop_65_plus: number
  density: number
  pct_0_14: number
  pct_15_64: number
  pct_65_plus: number
  density_percentile: number
  population_percentile: number
  pct_0_14_percentile: number
  pct_65_plus_percentile: number
  pct_15_64_percentile: number
}

function calculatePercentiles(values: number[]): Map<number, number> {
  const sorted = [...values].sort((a, b) => a - b)
  const percentiles = new Map<number, number>()
  
  values.forEach(v => {
    let count = 0
    for (const sv of sorted) {
      if (sv < v) count++
    }
    percentiles.set(v, (count / sorted.length) * 100)
  })
  
  return percentiles
}

async function main() {
  console.log('Processing data...')
  
  try {
    // Create output directory
    mkdirSync(OUTPUT_DIR, { recursive: true })
    mkdirSync('public/data/profiles', { recursive: true })
    
    // Read geometry
    console.log('Reading geometry...')
    const geojsonText = readFileSync(INPUT_GEOMETRY, 'utf-8')
    const geojson = JSON.parse(geojsonText) as GeoJSON.FeatureCollection
    console.log(`Loaded ${geojson.features.length} geometry features`)
    
    // Read demographics
    console.log('Reading demographics...')
    const csvText = readFileSync(INPUT_DEMOGRAPHICS, 'utf-8')
    const parsed = parseCSV(csvText, { delimiter: ';' })
    const demographics = csvToObjects<DemographicRow>(parsed)
    console.log(`Loaded ${demographics.length} demographic rows`)
    console.log('CSV Headers:', parsed.headers.join(', '))
    
    // Create lookup by PLR_ID
    const demoLookup = new Map<string, DemographicRow>()
    demographics.forEach(row => {
      const raumId = row['RAUMID'] || row['PLR_ID'] || ''
      if (raumId) {
        demoLookup.set(raumId, row)
      }
    })
    
    // Process each feature
    const processedAreas: ProcessedArea[] = []
    
    geojson.features.forEach(feature => {
      const props = feature.properties as Record<string, unknown>
      const plrId = (props['PLR_ID'] || props['plr_id'] || '') as string
      const demo = demoLookup.get(plrId)
      
      // Calculate area from geometry (approximate)
      const area_km2 = calculateAreaKm2(feature.geometry as GeoJSON.Geometry)
      
      // Extract population values (column names may vary - adjust based on actual CSV)
      const population = demo ? parseGermanNumber(demo['E_E'] || demo['INSGESAMT'] || '0') : 0
      const pop_0_14 = demo ? parseGermanNumber(demo['E_U15'] || '0') : 0
      const pop_15_64 = demo ? parseGermanNumber(demo['E_15U65'] || '0') : 0
      const pop_65_plus = demo ? parseGermanNumber(demo['E_65U110'] || '0') : 0
      
      const density = area_km2 > 0 ? population / area_km2 : 0
      const pct_0_14 = population > 0 ? (pop_0_14 / population) * 100 : 0
      const pct_15_64 = population > 0 ? (pop_15_64 / population) * 100 : 0
      const pct_65_plus = population > 0 ? (pop_65_plus / population) * 100 : 0
      
      processedAreas.push({
        PLR_ID: plrId,
        PLR_NAME: (props['PLR_NAME'] || props['plr_name'] || '') as string,
        BZR_ID: (props['BZR_ID'] || props['bzr_id'] || '') as string,
        BZR_NAME: (props['BZR_NAME'] || props['bzr_name'] || '') as string,
        BEZ_ID: (props['BEZ_ID'] || props['bez_id'] || '') as string,
        BEZ_NAME: (props['BEZ_NAME'] || props['bez_name'] || '') as string,
        population,
        area_km2,
        pop_0_14,
        pop_15_64,
        pop_65_plus,
        density,
        pct_0_14,
        pct_15_64,
        pct_65_plus,
        // Percentiles will be calculated below
        density_percentile: 0,
        population_percentile: 0,
        pct_0_14_percentile: 0,
        pct_65_plus_percentile: 0,
        pct_15_64_percentile: 0,
      })
    })
    
    // Calculate percentiles
    const densityPercentiles = calculatePercentiles(processedAreas.map(a => a.density))
    const populationPercentiles = calculatePercentiles(processedAreas.map(a => a.population))
    const pct014Percentiles = calculatePercentiles(processedAreas.map(a => a.pct_0_14))
    const pct65Percentiles = calculatePercentiles(processedAreas.map(a => a.pct_65_plus))
    const pct1564Percentiles = calculatePercentiles(processedAreas.map(a => a.pct_15_64))
    
    processedAreas.forEach(area => {
      area.density_percentile = densityPercentiles.get(area.density) || 0
      area.population_percentile = populationPercentiles.get(area.population) || 0
      area.pct_0_14_percentile = pct014Percentiles.get(area.pct_0_14) || 0
      area.pct_65_plus_percentile = pct65Percentiles.get(area.pct_65_plus) || 0
      area.pct_15_64_percentile = pct1564Percentiles.get(area.pct_15_64) || 0
    })
    
    // Update GeoJSON with processed data
    const areaLookup = new Map(processedAreas.map(a => [a.PLR_ID, a]))
    
    geojson.features.forEach(feature => {
      const props = feature.properties as Record<string, unknown>
      const plrId = (props['PLR_ID'] || props['plr_id'] || '') as string
      const area = areaLookup.get(plrId)
      
      if (area) {
        Object.assign(props, {
          population: area.population,
          density: Math.round(area.density),
          pct_0_14: Math.round(area.pct_0_14 * 10) / 10,
          pct_15_64: Math.round(area.pct_15_64 * 10) / 10,
          pct_65_plus: Math.round(area.pct_65_plus * 10) / 10,
        })
      }
    })
    
    // Write processed GeoJSON
    writeFileSync(OUTPUT_GEOJSON, JSON.stringify(geojson, null, 2))
    console.log(`Written processed GeoJSON to ${OUTPUT_GEOJSON}`)
    
    // Calculate Berlin stats
    const allDensities = processedAreas.map(a => a.density).sort((a, b) => a - b)
    const allPct014 = processedAreas.map(a => a.pct_0_14).sort((a, b) => a - b)
    const allPct1564 = processedAreas.map(a => a.pct_15_64).sort((a, b) => a - b)
    const allPct65 = processedAreas.map(a => a.pct_65_plus).sort((a, b) => a - b)
    
    const getMedian = (arr: number[]) => arr[Math.floor(arr.length / 2)] || 0
    const getP25 = (arr: number[]) => arr[Math.floor(arr.length * 0.25)] || 0
    const getP75 = (arr: number[]) => arr[Math.floor(arr.length * 0.75)] || 0
    
    const profiles = {
      metadata: {
        generated: new Date().toISOString(),
        source_date: '2024-12-31',
        total_areas: processedAreas.length,
      },
      berlin_stats: {
        population: processedAreas.reduce((sum, a) => sum + a.population, 0),
        total_areas: processedAreas.length,
        density_median: Math.round(getMedian(allDensities)),
        density_p25: Math.round(getP25(allDensities)),
        density_p75: Math.round(getP75(allDensities)),
        density_min: Math.round(allDensities[0] || 0),
        density_max: Math.round(allDensities[allDensities.length - 1] || 0),
        pct_0_14_median: Math.round(getMedian(allPct014) * 10) / 10,
        pct_15_64_median: Math.round(getMedian(allPct1564) * 10) / 10,
        pct_65_plus_median: Math.round(getMedian(allPct65) * 10) / 10,
      },
      areas: Object.fromEntries(processedAreas.map(a => [a.PLR_ID, a])),
    }
    
    writeFileSync(OUTPUT_PROFILES, JSON.stringify(profiles, null, 2))
    console.log(`Written profiles to ${OUTPUT_PROFILES}`)
    
    console.log('\nSummary:')
    console.log(`- Total areas: ${processedAreas.length}`)
    console.log(`- Total population: ${profiles.berlin_stats.population.toLocaleString()}`)
    console.log(`- Median density: ${profiles.berlin_stats.density_median.toLocaleString()} /km²`)
    
  } catch (error) {
    console.error('Error processing data:', error)
    process.exit(1)
  }
}

// Simple area calculation (approximate for small regions)
function calculateAreaKm2(geometry: GeoJSON.Geometry): number {
  if (geometry.type !== 'Polygon' && geometry.type !== 'MultiPolygon') {
    return 0
  }
  
  const polygons = geometry.type === 'Polygon' 
    ? [geometry.coordinates] 
    : geometry.coordinates
  
  let totalArea = 0
  
  for (const polygon of polygons) {
    const ring = polygon[0] // Outer ring
    if (!ring) continue
    
    // Shoelace formula with lat/lng to approximate km²
    let area = 0
    for (let i = 0; i < ring.length - 1; i++) {
      const [lng1, lat1] = ring[i] as [number, number]
      const [lng2, lat2] = ring[i + 1] as [number, number]
      area += lng1 * lat2 - lng2 * lat1
    }
    
    // Convert to km² (very rough approximation at Berlin's latitude)
    // 1 degree lat ≈ 111 km, 1 degree lng ≈ 67 km at 52°N
    totalArea += Math.abs(area) / 2 * 111 * 67
  }
  
  return totalArea
}

main()

