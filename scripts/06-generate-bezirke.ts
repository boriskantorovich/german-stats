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

interface DemographicRow {
  RAUMID: string
  BEZ: string
  [key: string]: string
}

interface BezirkStats {
  BEZ_ID: string
  BEZ_NAME: string
  population: number
  pop_male: number
  pop_female: number
  area_km2: number
  pop_0_14: number
  pop_15_64: number
  pop_65_plus: number
  density: number
  pct_0_14: number
  pct_15_64: number
  pct_65_plus: number
  pct_male: number
  pct_female: number
  planungsraeume_count: number
}

function calculateAreaKm2(geometry: GeoJSON.Geometry): number {
  try {
    // Use turf.area which returns area in square meters
    const areaM2 = turf.area(geometry)
    return areaM2 / 1_000_000 // Convert to km²
  } catch {
    return 0
  }
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
    // 3. Read demographics and aggregate by Bezirk
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\nReading demographics...')
    const csvText = readFileSync(INPUT_DEMOGRAPHICS, 'utf-8')
    const parsed = parseCSV(csvText, { delimiter: ';' })
    const demographics = csvToObjects<DemographicRow>(parsed)
    console.log(`  Loaded ${demographics.length} demographic rows`)
    
    // Aggregate demographics by Bezirk
    const bezirkDemographics = new Map<string, {
      population: number
      pop_male: number
      pop_female: number
      pop_0_14: number
      pop_15_64: number
      pop_65_plus: number
    }>()
    
    for (const row of demographics) {
      const bezId = (row['BEZ'] || '').padStart(2, '0')
      if (!bezId || bezId === '00') continue
      
      const population = parseGermanNumber(row['E_E'] || '0')
      const pop_male = parseGermanNumber(row['E_EM'] || '0')
      const pop_female = parseGermanNumber(row['E_EW'] || '0')
      
      // Age groups from CSV
      const ew_u1 = parseGermanNumber(row['E_EU1'] || '0')
      const ew_1_6 = parseGermanNumber(row['E_E1U6'] || '0')
      const ew_6_15 = parseGermanNumber(row['E_E6U15'] || '0')
      const ew_15_18 = parseGermanNumber(row['E_E15U18'] || '0')
      const ew_18_25 = parseGermanNumber(row['E_E18U25'] || '0')
      const ew_25_55 = parseGermanNumber(row['E_E25U55'] || '0')
      const ew_55_65 = parseGermanNumber(row['E_E55U65'] || '0')
      const ew_65_80 = parseGermanNumber(row['E_E65U80'] || '0')
      const ew_80_plus = parseGermanNumber(row['E_E80U110'] || '0')
      
      const pop_0_14 = ew_u1 + ew_1_6 + ew_6_15
      const pop_15_64 = ew_15_18 + ew_18_25 + ew_25_55 + ew_55_65
      const pop_65_plus = ew_65_80 + ew_80_plus
      
      if (!bezirkDemographics.has(bezId)) {
        bezirkDemographics.set(bezId, {
          population: 0,
          pop_male: 0,
          pop_female: 0,
          pop_0_14: 0,
          pop_15_64: 0,
          pop_65_plus: 0,
        })
      }
      
      const agg = bezirkDemographics.get(bezId)!
      agg.population += population
      agg.pop_male += pop_male
      agg.pop_female += pop_female
      agg.pop_0_14 += pop_0_14
      agg.pop_15_64 += pop_15_64
      agg.pop_65_plus += pop_65_plus
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // 4. Dissolve polygons and create Bezirk features
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\nDissolving polygons...')
    const bezirkFeatures: GeoJSON.Feature[] = []
    const bezirkStats: BezirkStats[] = []
    
    for (const [bezId, features] of bezirkGroups) {
      console.log(`  Processing ${BEZIRK_NAMES[bezId] || bezId}...`)
      
      // Union all polygons in this Bezirk
      let dissolved: GeoJSON.Feature | null = null
      
      try {
        // Create a FeatureCollection and use turf.dissolve or union
        const fc = turf.featureCollection(features as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>[])
        
        // Use turf.union to merge all polygons
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
        // Fallback: use first polygon (not ideal but prevents crash)
        dissolved = features[0]
      }
      
      if (!dissolved) continue
      
      // Calculate area from dissolved geometry
      const area_km2 = calculateAreaKm2(dissolved.geometry)
      
      // Get demographics for this Bezirk
      const demo = bezirkDemographics.get(bezId) || {
        population: 0,
        pop_male: 0,
        pop_female: 0,
        pop_0_14: 0,
        pop_15_64: 0,
        pop_65_plus: 0,
      }
      
      const density = area_km2 > 0 ? demo.population / area_km2 : 0
      const pct_0_14 = demo.population > 0 ? (demo.pop_0_14 / demo.population) * 100 : 0
      const pct_15_64 = demo.population > 0 ? (demo.pop_15_64 / demo.population) * 100 : 0
      const pct_65_plus = demo.population > 0 ? (demo.pop_65_plus / demo.population) * 100 : 0
      const pct_male = demo.population > 0 ? (demo.pop_male / demo.population) * 100 : 0
      const pct_female = demo.population > 0 ? (demo.pop_female / demo.population) * 100 : 0
      
      const stats: BezirkStats = {
        BEZ_ID: bezId,
        BEZ_NAME: BEZIRK_NAMES[bezId] || `Bezirk ${bezId}`,
        population: demo.population,
        pop_male: demo.pop_male,
        pop_female: demo.pop_female,
        area_km2,
        pop_0_14: demo.pop_0_14,
        pop_15_64: demo.pop_15_64,
        pop_65_plus: demo.pop_65_plus,
        density,
        pct_0_14,
        pct_15_64,
        pct_65_plus,
        pct_male,
        pct_female,
        planungsraeume_count: features.length,
      }
      
      bezirkStats.push(stats)
      
      // Create feature with properties
      const bezirkFeature: GeoJSON.Feature = {
        type: 'Feature',
        properties: {
          BEZ_ID: bezId,
          BEZ_NAME: BEZIRK_NAMES[bezId] || `Bezirk ${bezId}`,
          population: Math.round(demo.population),
          density: Math.round(density),
          pct_0_14: Math.round(pct_0_14 * 10) / 10,
          pct_15_64: Math.round(pct_15_64 * 10) / 10,
          pct_65_plus: Math.round(pct_65_plus * 10) / 10,
          pct_male: Math.round(pct_male * 10) / 10,
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
    
    const calcPercentile = (value: number, sortedArr: number[]) => {
      let count = 0
      for (const v of sortedArr) {
        if (v < value) count++
      }
      return (count / sortedArr.length) * 100
    }
    
    const sortedDensities = [...bezirkStats.map(s => s.density)].sort((a, b) => a - b)
    const sortedPopulations = [...bezirkStats.map(s => s.population)].sort((a, b) => a - b)
    const sortedPct014 = [...bezirkStats.map(s => s.pct_0_14)].sort((a, b) => a - b)
    const sortedPct65 = [...bezirkStats.map(s => s.pct_65_plus)].sort((a, b) => a - b)
    
    const bezirkProfiles = bezirkStats.map(stats => ({
      ...stats,
      density_percentile: calcPercentile(stats.density, sortedDensities),
      population_percentile: calcPercentile(stats.population, sortedPopulations),
      pct_0_14_percentile: calcPercentile(stats.pct_0_14, sortedPct014),
      pct_65_plus_percentile: calcPercentile(stats.pct_65_plus, sortedPct65),
    }))
    
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
    const getMedian = (arr: number[]) => arr[Math.floor(arr.length / 2)] || 0
    const profiles = {
      metadata: {
        generated: new Date().toISOString(),
        source_date: '2024-12-31',
        total_bezirke: bezirkProfiles.length,
      },
      berlin_stats: {
        population: bezirkStats.reduce((sum, s) => sum + s.population, 0),
        total_bezirke: bezirkProfiles.length,
        density_median: Math.round(getMedian(sortedDensities)),
        pct_0_14_median: Math.round(getMedian(sortedPct014) * 10) / 10,
        pct_65_plus_median: Math.round(getMedian(sortedPct65) * 10) / 10,
      },
      bezirke: Object.fromEntries(bezirkProfiles.map(b => [b.BEZ_ID, b])),
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

