/**
 * Script to generate Bezirk-level geometry and aggregated demographics
 * 
 * This script:
 * 1. Reads Planungsräume geometry (542 polygons)
 * 2. Groups by Bezirk (first 2 digits of PLR_ID)
 * 3. Dissolves/unions polygons to create 12 Bezirk boundaries
 * 4. Aggregates demographics from CSV by Bezirk
 * 5. Outputs Bezirke GeoJSON with aggregated stats
 * 
 * Run with: npx tsx scripts/06-generate-bezirke.ts
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import * as turf from '@turf/turf'
import { parseCSV, csvToObjects, parseGermanNumber } from './lib/csv-parser'
import { calculateDemographics, aggregateDemographics, type RawDemographicData, type DemographicMetrics } from './lib/demographics'

const INPUT_GEOMETRY = 'data/raw/lor-planungsraeume.geojson'
const INPUT_DEMOGRAPHICS = 'data/raw/population-2024.csv'
const OUTPUT_DIR = 'data/processed'
const OUTPUT_BEZIRKE = `${OUTPUT_DIR}/bezirke.geojson`
const OUTPUT_PROFILES = 'public/data/profiles/bezirke.json'

// Berlin Bezirk names (official)
const BEZIRK_NAMES: Record<string, string> = {
  '01': 'Mitte',
  '02': 'Friedrichshain-Kreuzberg',
  '03': 'Pankow',
  '04': 'Charlottenburg-Wilmersdorf',
  '05': 'Spandau',
  '06': 'Steglitz-Zehlendorf',
  '07': 'Tempelhof-Schöneberg',
  '08': 'Neukölln',
  '09': 'Treptow-Köpenick',
  '10': 'Marzahn-Hellersdorf',
  '11': 'Lichtenberg',
  '12': 'Reinickendorf',
}

interface BezirkStats extends DemographicMetrics {
  BEZ_ID: string
  BEZ_NAME: string
  area_km2: number
  density: number
  planungsraeume_count: number
  // Percentiles
  density_percentile: number
  population_percentile: number
  pct_0_14_percentile: number
  pct_65_plus_percentile: number
  sex_ratio_percentile: number
  aging_index_percentile: number
}

function calculateAreaKm2(geometry: GeoJSON.Geometry): number {
  try {
    const areaM2 = turf.area(geometry)
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
  console.log('Generating Bezirke from Planungsräume...\n')
  
  try {
    // Create output directories
    mkdirSync(OUTPUT_DIR, { recursive: true })
    mkdirSync('public/data/profiles', { recursive: true })
    
    // ─────────────────────────────────────────────────────────────────────────
    // 1. Read Planungsräume geometry
    // ─────────────────────────────────────────────────────────────────────────
    console.log('Reading Planungsräume geometry...')
    const geojsonText = readFileSync(INPUT_GEOMETRY, 'utf-8')
    const geojson = JSON.parse(geojsonText) as GeoJSON.FeatureCollection
    console.log(`  Loaded ${geojson.features.length} Planungsräume`)
    
    // ─────────────────────────────────────────────────────────────────────────
    // 2. Group features by Bezirk (first 2 digits of PLR_ID)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\nGrouping by Bezirk...')
    const bezirkGroups = new Map<string, GeoJSON.Feature[]>()
    
    for (const feature of geojson.features) {
      const props = feature.properties as Record<string, unknown>
      const plrId = (props['PLR_ID'] || props['plr_id'] || '') as string
      const bezId = plrId.slice(0, 2)
      
      if (!bezId || bezId === '00') continue
      
      if (!bezirkGroups.has(bezId)) {
        bezirkGroups.set(bezId, [])
      }
      bezirkGroups.get(bezId)!.push(feature)
    }
    
    console.log(`  Found ${bezirkGroups.size} Bezirke`)
    for (const [bezId, features] of bezirkGroups) {
      console.log(`    ${bezId} (${BEZIRK_NAMES[bezId] || 'Unknown'}): ${features.length} Planungsräume`)
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // 3. Read demographics and calculate metrics for each Planungsraum
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\nReading demographics...')
    const csvText = readFileSync(INPUT_DEMOGRAPHICS, 'utf-8')
    const parsed = parseCSV(csvText, { delimiter: ';' })
    const demographics = csvToObjects<RawDemographicData>(parsed)
    console.log(`  Loaded ${demographics.length} demographic rows`)
    
    // Calculate demographics for each Planungsraum
    const planungsraumDemographics = new Map<string, DemographicMetrics>()
    
    for (const row of demographics) {
      const bezId = (row.BEZ || '').padStart(2, '0')
      const pgrId = (row.PGR || '').padStart(2, '0')
      const bzrId = (row.BZR || '').padStart(2, '0')
      const plrId = (row.PLR || '').padStart(2, '0')
      const fullId = bezId + pgrId + bzrId + plrId
      
      if (!fullId || fullId === '00000000') continue
      
      const metrics = calculateDemographics(row, parseGermanNumber)
      planungsraumDemographics.set(fullId, metrics)
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // 4. Dissolve polygons and aggregate demographics for each Bezirk
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\nDissolving polygons and aggregating data...')
    const bezirkFeatures: GeoJSON.Feature[] = []
    const bezirkStats: BezirkStats[] = []
    
    for (const [bezId, features] of bezirkGroups) {
      console.log(`  Processing ${BEZIRK_NAMES[bezId] || bezId}...`)
      
      // Union all polygons in this Bezirk
      let dissolved: GeoJSON.Feature | null = null
      
      try {
        let unionResult = features[0] as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>
        for (let i = 1; i < features.length; i++) {
          const nextFeature = features[i] as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>
          try {
            unionResult = turf.union(
              turf.featureCollection([unionResult, nextFeature])
            ) as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>
          } catch (e) {
            console.warn(`    Warning: Could not union feature ${i}, skipping`)
          }
        }
        dissolved = unionResult
      } catch (e) {
        console.error(`    Error dissolving ${bezId}:`, e)
        dissolved = features[0]
      }
      
      if (!dissolved) continue
      
      // Calculate area from dissolved geometry
      const area_km2 = calculateAreaKm2(dissolved.geometry)
      
      // Aggregate demographics from all Planungsräume in this Bezirk
      const plrMetrics: DemographicMetrics[] = []
      for (const feature of features) {
        const props = feature.properties as Record<string, unknown>
        const plrId = (props['PLR_ID'] || props['plr_id'] || '') as string
        const metrics = planungsraumDemographics.get(plrId)
        if (metrics) {
          plrMetrics.push(metrics)
        }
      }
      
      const aggregatedDemo = aggregateDemographics(plrMetrics)
      const density = area_km2 > 0 ? aggregatedDemo.population / area_km2 : 0
      
      const stats: BezirkStats = {
        BEZ_ID: bezId,
        BEZ_NAME: BEZIRK_NAMES[bezId] || `Bezirk ${bezId}`,
        planungsraeume_count: features.length,
        area_km2,
        density,
        ...aggregatedDemo,
        // Percentiles will be calculated below
        density_percentile: 0,
        population_percentile: 0,
        pct_0_14_percentile: 0,
        pct_65_plus_percentile: 0,
        sex_ratio_percentile: 0,
        aging_index_percentile: 0,
      }
      
      bezirkStats.push(stats)
      
      // Create feature with properties
      const bezirkFeature: GeoJSON.Feature = {
        type: 'Feature',
        properties: {
          BEZ_ID: bezId,
          BEZ_NAME: BEZIRK_NAMES[bezId] || `Bezirk ${bezId}`,
          
          // Core
          population: Math.round(aggregatedDemo.population),
          density: Math.round(density),
          
          // Gender
          pct_male: Math.round(aggregatedDemo.pct_male * 10) / 10,
          pct_female: Math.round(aggregatedDemo.pct_female * 10) / 10,
          sex_ratio: Math.round(aggregatedDemo.sex_ratio * 10) / 10,
          
          // Broad age groups
          pct_0_14: Math.round(aggregatedDemo.pct_0_14 * 10) / 10,
          pct_15_64: Math.round(aggregatedDemo.pct_15_64 * 10) / 10,
          pct_65_plus: Math.round(aggregatedDemo.pct_65_plus * 10) / 10,
          
          // Granular age bands
          pct_0_5: Math.round(aggregatedDemo.pct_0_5 * 10) / 10,
          pct_6_14: Math.round(aggregatedDemo.pct_6_14 * 10) / 10,
          pct_15_17: Math.round(aggregatedDemo.pct_15_17 * 10) / 10,
          pct_18_24: Math.round(aggregatedDemo.pct_18_24 * 10) / 10,
          pct_25_34: Math.round(aggregatedDemo.pct_25_34 * 10) / 10,
          pct_35_44: Math.round(aggregatedDemo.pct_35_44 * 10) / 10,
          pct_45_54: Math.round(aggregatedDemo.pct_45_54 * 10) / 10,
          pct_55_64: Math.round(aggregatedDemo.pct_55_64 * 10) / 10,
          pct_65_79: Math.round(aggregatedDemo.pct_65_79 * 10) / 10,
          pct_80_plus: Math.round(aggregatedDemo.pct_80_plus * 10) / 10,
          
          // Dependency indicators
          aging_index: Math.round(aggregatedDemo.aging_index * 10) / 10,
          dependency_ratio: Math.round(aggregatedDemo.dependency_ratio * 10) / 10,
          elderly_dependency: Math.round(aggregatedDemo.elderly_dependency * 10) / 10,
          youth_dependency: Math.round(aggregatedDemo.youth_dependency * 10) / 10,
        },
        geometry: dissolved.geometry,
      }
      
      bezirkFeatures.push(bezirkFeature)
    }
    
    // Sort by BEZ_ID
    bezirkFeatures.sort((a, b) => 
      (a.properties?.BEZ_ID || '').localeCompare(b.properties?.BEZ_ID || '')
    )
    bezirkStats.sort((a, b) => a.BEZ_ID.localeCompare(b.BEZ_ID))
    
    // ─────────────────────────────────────────────────────────────────────────
    // 5. Calculate percentiles for Bezirke
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\nCalculating percentiles...')
    
    const densityPercentiles = calculatePercentiles(bezirkStats.map(s => s.density))
    const populationPercentiles = calculatePercentiles(bezirkStats.map(s => s.population))
    const pct014Percentiles = calculatePercentiles(bezirkStats.map(s => s.pct_0_14))
    const pct65Percentiles = calculatePercentiles(bezirkStats.map(s => s.pct_65_plus))
    const sexRatioPercentiles = calculatePercentiles(bezirkStats.map(s => s.sex_ratio))
    const agingIndexPercentiles = calculatePercentiles(bezirkStats.map(s => s.aging_index))
    
    bezirkStats.forEach(stats => {
      stats.density_percentile = densityPercentiles.get(stats.density) || 0
      stats.population_percentile = populationPercentiles.get(stats.population) || 0
      stats.pct_0_14_percentile = pct014Percentiles.get(stats.pct_0_14) || 0
      stats.pct_65_plus_percentile = pct65Percentiles.get(stats.pct_65_plus) || 0
      stats.sex_ratio_percentile = sexRatioPercentiles.get(stats.sex_ratio) || 0
      stats.aging_index_percentile = agingIndexPercentiles.get(stats.aging_index) || 0
    })
    
    // ─────────────────────────────────────────────────────────────────────────
    // 6. Write output files
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\nWriting output files...')
    
    // Write Bezirke GeoJSON
    const bezirkeGeoJson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: bezirkFeatures,
    }
    writeFileSync(OUTPUT_BEZIRKE, JSON.stringify(bezirkeGeoJson, null, 2))
    console.log(`  Written ${OUTPUT_BEZIRKE}`)
    
    // Write Bezirke profiles
    const sortedDensities = bezirkStats.map(s => s.density).sort((a, b) => a - b)
    const sortedPct014 = bezirkStats.map(s => s.pct_0_14).sort((a, b) => a - b)
    const sortedPct65 = bezirkStats.map(s => s.pct_65_plus).sort((a, b) => a - b)
    
    const getMedian = (arr: number[]) => arr[Math.floor(arr.length / 2)] || 0
    
    const profiles = {
      metadata: {
        generated: new Date().toISOString(),
        source_date: '2024-12-31',
        total_bezirke: bezirkStats.length,
      },
      berlin_stats: {
        population: bezirkStats.reduce((sum, s) => sum + s.population, 0),
        total_bezirke: bezirkStats.length,
        density_median: Math.round(getMedian(sortedDensities)),
        pct_0_14_median: Math.round(getMedian(sortedPct014) * 10) / 10,
        pct_65_plus_median: Math.round(getMedian(sortedPct65) * 10) / 10,
      },
      bezirke: Object.fromEntries(bezirkStats.map(b => [b.BEZ_ID, b])),
    }
    writeFileSync(OUTPUT_PROFILES, JSON.stringify(profiles, null, 2))
    console.log(`  Written ${OUTPUT_PROFILES}`)
    
    // ─────────────────────────────────────────────────────────────────────────
    // Summary
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n' + '═'.repeat(60))
    console.log('BEZIRKE GENERATION COMPLETE')
    console.log('═'.repeat(60))
    console.log(`\nGenerated ${bezirkFeatures.length} Bezirke from ${geojson.features.length} Planungsräume`)
    console.log(`\nTotal Berlin population: ${profiles.berlin_stats.population.toLocaleString()}`)
    console.log(`\nBezirke summary:`)
    for (const stats of bezirkStats) {
      console.log(`  ${stats.BEZ_ID} ${stats.BEZ_NAME.padEnd(28)} Pop: ${stats.population.toLocaleString().padStart(9)}  Density: ${Math.round(stats.density).toLocaleString().padStart(6)}/km²`)
    }
    
  } catch (error) {
    console.error('Error generating Bezirke:', error)
    process.exit(1)
  }
}

main()
