/**
 * Script to join geometry with demographics and compute derived values
 * 
 * Run with: npx tsx scripts/03-process-data.ts
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { parseCSV, csvToObjects, parseGermanNumber } from './lib/csv-parser'
import { calculateDemographics, type RawDemographicData, type DemographicMetrics } from './lib/demographics'

const INPUT_GEOMETRY = 'data/raw/lor-planungsraeume.geojson'
const INPUT_DEMOGRAPHICS = 'data/raw/population-2024.csv'
const OUTPUT_DIR = 'data/processed'
const OUTPUT_GEOJSON = `${OUTPUT_DIR}/lor-with-data.geojson`
const OUTPUT_PROFILES = 'public/data/profiles/index.json'

interface ProcessedArea extends DemographicMetrics {
  PLR_ID: string
  area_km2: number
  density: number
  // Percentiles
  density_percentile: number
  population_percentile: number
  pct_0_14_percentile: number
  pct_15_64_percentile: number
  pct_65_plus_percentile: number
  sex_ratio_percentile: number
  aging_index_percentile: number
}

function calculateAreaKm2(geometry: GeoJSON.Geometry): number {
  if (geometry.type !== 'Polygon' && geometry.type !== 'MultiPolygon') return 0
  
  // Simple approximate calculation using coordinate bounds
  // For precise calculations, use turf.area
  try {
    const coords = geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates[0]
    if (!coords || coords.length === 0) return 0
    
    const ring = coords[0]
    let area = 0
    for (let i = 0; i < ring.length - 1; i++) {
      area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]
    }
    const areaM2 = Math.abs(area / 2) * 111320 * 111320
    return areaM2 / 1_000_000 // Convert to km²
  } catch {
    return 0
  }
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
  console.log('Processing Planungsraum data...')
  
  try {
    // Create output directories
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
    const demographics = csvToObjects<RawDemographicData>(parsed)
    console.log(`Loaded ${demographics.length} demographic rows`)
    
    // Create lookup by PLR_ID
    const demoLookup = new Map<string, RawDemographicData>()
    demographics.forEach(row => {
      const bez = (row.BEZ || '').padStart(2, '0')
      const pgr = (row.PGR || '').padStart(2, '0')
      const bzr = (row.BZR || '').padStart(2, '0')
      const plr = (row.PLR || '').padStart(2, '0')
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
      
      const area_km2 = calculateAreaKm2(feature.geometry as GeoJSON.Geometry)
      
      if (demo) {
        // Use shared demographics calculation
        const demographics = calculateDemographics(demo, parseGermanNumber)
        const density = area_km2 > 0 ? demographics.population / area_km2 : 0
        
        processedAreas.push({
          PLR_ID: plrId,
          area_km2,
          density,
          ...demographics,
          // Percentiles will be calculated below
          density_percentile: 0,
          population_percentile: 0,
          pct_0_14_percentile: 0,
          pct_15_64_percentile: 0,
          pct_65_plus_percentile: 0,
          sex_ratio_percentile: 0,
          aging_index_percentile: 0,
        })
      }
    })
    
    console.log(`Processed ${processedAreas.length} areas`)
    
    // Calculate percentiles
    console.log('Calculating percentiles...')
    const densityPercentiles = calculatePercentiles(processedAreas.map(a => a.density))
    const populationPercentiles = calculatePercentiles(processedAreas.map(a => a.population))
    const pct014Percentiles = calculatePercentiles(processedAreas.map(a => a.pct_0_14))
    const pct1564Percentiles = calculatePercentiles(processedAreas.map(a => a.pct_15_64))
    const pct65Percentiles = calculatePercentiles(processedAreas.map(a => a.pct_65_plus))
    const sexRatioPercentiles = calculatePercentiles(processedAreas.map(a => a.sex_ratio))
    const agingIndexPercentiles = calculatePercentiles(processedAreas.map(a => a.aging_index))
    
    processedAreas.forEach(area => {
      area.density_percentile = densityPercentiles.get(area.density) || 0
      area.population_percentile = populationPercentiles.get(area.population) || 0
      area.pct_0_14_percentile = pct014Percentiles.get(area.pct_0_14) || 0
      area.pct_15_64_percentile = pct1564Percentiles.get(area.pct_15_64) || 0
      area.pct_65_plus_percentile = pct65Percentiles.get(area.pct_65_plus) || 0
      area.sex_ratio_percentile = sexRatioPercentiles.get(area.sex_ratio) || 0
      area.aging_index_percentile = agingIndexPercentiles.get(area.aging_index) || 0
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
          pct_male: Math.round(area.pct_male * 10) / 10,
          pct_female: Math.round(area.pct_female * 10) / 10,
          sex_ratio: Math.round(area.sex_ratio * 10) / 10,
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
    
    const berlinStats = {
      population: processedAreas.reduce((sum, a) => sum + a.population, 0),
      total_areas: processedAreas.length,
      density_median: Math.round(getMedian(allDensities)),
      density_p25: Math.round(getP25(allDensities)),
      density_p75: Math.round(getP75(allDensities)),
      density_min: Math.round(Math.min(...allDensities)),
      density_max: Math.round(Math.max(...allDensities)),
      pct_0_14_median: Math.round(getMedian(allPct014) * 10) / 10,
      pct_15_64_median: Math.round(getMedian(allPct1564) * 10) / 10,
      pct_65_plus_median: Math.round(getMedian(allPct65) * 10) / 10,
    }
    
    // Prepare JSON output
    const profiles = {
      metadata: {
        generated: new Date().toISOString(),
        source_date: '2024-12-31',
        total_areas: processedAreas.length,
      },
      berlin_stats: berlinStats,
      areas: Object.fromEntries(processedAreas.map(a => [a.PLR_ID, a])),
    }
    
    writeFileSync(OUTPUT_PROFILES, JSON.stringify(profiles, null, 2))
    console.log(`Written profile data to ${OUTPUT_PROFILES}`)
    
    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('PROCESSING COMPLETE')
    console.log('='.repeat(60))
    console.log(`Planungsräume: ${processedAreas.length}`)
    console.log(`Berlin population: ${berlinStats.population.toLocaleString()}`)
    console.log(`Density range: ${berlinStats.density_min} - ${berlinStats.density_max} /km²`)
    console.log(`Youth (0-14): ${berlinStats.pct_0_14_median}% median`)
    console.log(`Elderly (65+): ${berlinStats.pct_65_plus_median}% median`)
    
  } catch (error) {
    console.error('Error processing data:', error)
    process.exit(1)
  }
}

main()
