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
    // The CSV has separate columns: BEZ (2 digits) + PGR (2 digits) + BZR (2 digits) + PLR (2 digits)
    // Combined they form the 8-digit PLR_ID (e.g., "01" + "10" + "01" + "01" = "01100101")
    const demoLookup = new Map<string, DemographicRow>()
    demographics.forEach(row => {
      const bez = (row['BEZ'] || '').padStart(2, '0')
      const pgr = (row['PGR'] || '').padStart(2, '0')
      const bzr = (row['BZR'] || '').padStart(2, '0')
      const plr = (row['PLR'] || '').padStart(2, '0')
      const fullId = bez + pgr + bzr + plr
      
      if (fullId && fullId !== '00000000') {
        demoLookup.set(fullId, row)
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
      
      // Extract population values from real CSV columns
      // E_E = total population
      // E_EU1 = under 1 year, E_E1U6 = 1 to under 6, E_E6U15 = 6 to under 15
      // E_E15U18 = 15 to under 18, E_E18U25 = 18 to under 25
      // E_E25U55 = 25 to under 55, E_E55U65 = 55 to under 65
      // E_E65U80 = 65 to under 80, E_E80U110 = 80+
      const population = demo ? parseGermanNumber(demo['E_E'] || '0') : 0
      
      // Use aggregated age groups from CSV
      const ew_u1 = demo ? parseGermanNumber(demo['E_EU1'] || '0') : 0
      const ew_1_6 = demo ? parseGermanNumber(demo['E_E1U6'] || '0') : 0
      const ew_6_15 = demo ? parseGermanNumber(demo['E_E6U15'] || '0') : 0
      const ew_15_18 = demo ? parseGermanNumber(demo['E_E15U18'] || '0') : 0
      const ew_18_25 = demo ? parseGermanNumber(demo['E_E18U25'] || '0') : 0
      const ew_25_55 = demo ? parseGermanNumber(demo['E_E25U55'] || '0') : 0
      const ew_55_65 = demo ? parseGermanNumber(demo['E_E55U65'] || '0') : 0
      const ew_65_80 = demo ? parseGermanNumber(demo['E_E65U80'] || '0') : 0
      const ew_80_plus = demo ? parseGermanNumber(demo['E_E80U110'] || '0') : 0
      
      // Calculate standard age groups
      const pop_0_14 = ew_u1 + ew_1_6 + ew_6_15  // 0-14 years
      const pop_15_64 = ew_15_18 + ew_18_25 + ew_25_55 + ew_55_65  // 15-64 years (working age)
      const pop_65_plus = ew_65_80 + ew_80_plus  // 65+ years (retirement age)
      
      const density = area_km2 > 0 ? population / area_km2 : 0
      const pct_0_14 = population > 0 ? (pop_0_14 / population) * 100 : 0
      const pct_15_64 = population > 0 ? (pop_15_64 / population) * 100 : 0
      const pct_65_plus = population > 0 ? (pop_65_plus / population) * 100 : 0
      
      processedAreas.push({
        PLR_ID: plrId,
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

