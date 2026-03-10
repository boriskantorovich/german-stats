/**
 * Universal city data processor
 * Processes any city based on config
 * 
 * Run with: npx tsx scripts/universal-process.ts <city-id>
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { execSync } from 'child_process'
import { getCityConfig } from '../cities'
import { parseCSV, csvToObjects, parseGermanNumber } from './lib/csv-parser'
import { calculateDemographics, type RawDemographicData, type DemographicMetrics } from './lib/demographics'

interface ProcessedArea extends DemographicMetrics {
  id: string
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
  
  try {
    const coords = geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates[0]
    if (!coords || coords.length === 0) return 0
    
    const ring = coords[0]
    let area = 0
    for (let i = 0; i < ring.length - 1; i++) {
      area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]
    }
    const areaM2 = Math.abs(area / 2) * 111320 * 111320
    return areaM2 / 1_000_000
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

async function fetchGeometry(cityId: string): Promise<GeoJSON.FeatureCollection> {
  const config = getCityConfig(cityId)
  if (!config) throw new Error(`City ${cityId} not found`)
  
  const outputPath = `data/raw/${cityId}/geometry.geojson`
  
  // Check if already downloaded
  if (existsSync(outputPath)) {
    console.log(`✅ Using cached geometry: ${outputPath}`)
    return JSON.parse(readFileSync(outputPath, 'utf-8'))
  }
  
  console.log(`Fetching geometry for ${config.name}...`)
  
  if (config.geometry.source === 'wfs') {
    // Download from WFS
    const tempGml = `data/raw/${cityId}/geometry.gml`
    console.log(`  Downloading from WFS...`)
    execSync(`curl -s "${config.geometry.url}" -o ${tempGml}`)
    
    // Convert to GeoJSON
    console.log(`  Converting to GeoJSON...`)
    execSync(`ogr2ogr -f GeoJSON -t_srs EPSG:4326 ${outputPath} ${tempGml}`)
    
    console.log(`✅ Geometry downloaded and converted`)
  } else if (config.geometry.source === 'file') {
    // Assume file is already in place
    const localPath = `data/raw/${cityId}/${config.geometry.format === 'shapefile' ? '*.shp' : 'geometry.geojson'}`
    if (!existsSync(localPath)) {
      throw new Error(`Geometry file not found: ${localPath}. Please download manually.`)
    }
  }
  
  return JSON.parse(readFileSync(outputPath, 'utf-8'))
}

async function processCityData(cityId: string) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`Processing: ${cityId.toUpperCase()}`)
  console.log('='.repeat(60) + '\n')
  
  const config = getCityConfig(cityId)
  if (!config) {
    throw new Error(`City configuration not found: ${cityId}`)
  }
  
  // Create directories
  mkdirSync(`data/raw/${cityId}`, { recursive: true })
  mkdirSync(`data/processed/${cityId}`, { recursive: true })
  mkdirSync(`public/data/${cityId}`, { recursive: true })
  mkdirSync(`public/data/${cityId}/profiles`, { recursive: true })
  
  // Fetch/load geometry
  const geojson = await fetchGeometry(cityId)
  console.log(`Loaded ${geojson.features.length} geometry features`)
  
  // Load demographics (if file exists)
  const demoFile = config.demographics.file || config.demographics.url
  if (!demoFile || !existsSync(demoFile)) {
    console.warn(`⚠️  Demographics file not found: ${demoFile}`)
    console.warn(`   Skipping demographic join for now`)
    
    // Still output geometry-only file
    writeFileSync(
      `data/processed/${cityId}/geometry-only.geojson`,
      JSON.stringify(geojson, null, 2)
    )
    return
  }
  
  console.log('Reading demographics...')
  const csvText = readFileSync(demoFile, config.demographics.encoding || 'utf-8')
  const parsed = parseCSV(csvText, { delimiter: config.demographics.delimiter || ';' })
  const demographics = csvToObjects<RawDemographicData>(parsed)
  console.log(`Loaded ${demographics.length} demographic rows`)
  
  // Create lookup by ID
  const demoLookup = new Map<string, RawDemographicData>()
  demographics.forEach(row => {
    const id = String(row[config.demographics.idField as keyof RawDemographicData] || '')
    if (id) {
      demoLookup.set(id, row)
    }
  })
  
  // Process each feature
  const processedAreas: ProcessedArea[] = []
  
  geojson.features.forEach(feature => {
    const props = feature.properties as Record<string, unknown>
    const areaId = String(props[config.geometry.idField] || '')
    const demo = demoLookup.get(areaId)
    
    const area_km2 = calculateAreaKm2(feature.geometry as GeoJSON.Geometry)
    
    if (demo) {
      const demographics = calculateDemographics(demo, parseGermanNumber)
      const density = area_km2 > 0 ? demographics.population / area_km2 : 0
      
      processedAreas.push({
        id: areaId,
        area_km2,
        density,
        ...demographics,
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
  
  // Update GeoJSON
  const areaLookup = new Map(processedAreas.map(a => [a.id, a]))
  
  geojson.features.forEach(feature => {
    const props = feature.properties as Record<string, unknown>
    const areaId = String(props[config.geometry.idField] || '')
    const area = areaLookup.get(areaId)
    
    if (area) {
      Object.assign(props, {
        population: area.population,
        density: Math.round(area.density),
        pct_male: Math.round(area.pct_male * 10) / 10,
        pct_female: Math.round(area.pct_female * 10) / 10,
        sex_ratio: Math.round(area.sex_ratio * 10) / 10,
        pct_0_14: Math.round(area.pct_0_14 * 10) / 10,
        pct_15_64: Math.round(area.pct_15_64 * 10) / 10,
        pct_65_plus: Math.round(area.pct_65_plus * 10) / 10,
        aging_index: Math.round(area.aging_index * 10) / 10,
        dependency_ratio: Math.round(area.dependency_ratio * 10) / 10,
      })
    }
  })
  
  // Write outputs
  const outputGeojson = `data/processed/${cityId}/${cityId}-with-data.geojson`
  writeFileSync(outputGeojson, JSON.stringify(geojson, null, 2))
  console.log(`Written: ${outputGeojson}`)
  
  // City stats
  const allDensities = processedAreas.map(a => a.density).sort((a, b) => a - b)
  const getMedian = (arr: number[]) => arr[Math.floor(arr.length / 2)] || 0
  
  const cityStats = {
    population: processedAreas.reduce((sum, a) => sum + a.population, 0),
    total_areas: processedAreas.length,
    density_median: Math.round(getMedian(allDensities)),
  }
  
  // Profiles
  const profiles = {
    metadata: {
      generated: new Date().toISOString(),
      city: config.name,
      total_areas: processedAreas.length,
    },
    city_stats: cityStats,
    areas: Object.fromEntries(processedAreas.map(a => [a.id, a])),
  }
  
  const outputProfiles = `public/data/${cityId}/profiles/index.json`
  writeFileSync(outputProfiles, JSON.stringify(profiles, null, 2))
  console.log(`Written: ${outputProfiles}`)
  
  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('PROCESSING COMPLETE')
  console.log('='.repeat(60))
  console.log(`City: ${config.name}`)
  console.log(`Areas: ${processedAreas.length}`)
  console.log(`Population: ${cityStats.population.toLocaleString()}`)
  console.log(`Density median: ${cityStats.density_median} /km²`)
}

async function main() {
  const cityId = process.argv[2]
  
  if (!cityId) {
    console.error('Usage: npx tsx scripts/universal-process.ts <city-id>')
    console.error('Available cities: berlin, hamburg, munich')
    process.exit(1)
  }
  
  try {
    await processCityData(cityId)
  } catch (error) {
    console.error('Error processing city:', error)
    process.exit(1)
  }
}

main()


