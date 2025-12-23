/**
 * Script to regenerate profiles JSON from processed GeoJSON
 * (Alternative to running full 03-process-data.ts)
 * 
 * Run with: npx tsx scripts/05-generate-profiles.ts
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs'

const INPUT_GEOJSON = 'data/processed/lor-with-data.geojson'
const OUTPUT_PROFILES = 'public/data/profiles/index.json'

async function main() {
  console.log('Generating profiles from processed GeoJSON...')
  
  try {
    mkdirSync('public/data/profiles', { recursive: true })
    
    // Read processed GeoJSON
    const geojsonText = readFileSync(INPUT_GEOJSON, 'utf-8')
    const geojson = JSON.parse(geojsonText) as GeoJSON.FeatureCollection
    
    console.log(`Loaded ${geojson.features.length} features`)
    
    // Extract areas
    const areas: Record<string, Record<string, unknown>> = {}
    const densities: number[] = []
    const populations: number[] = []
    const pct014s: number[] = []
    const pct1564s: number[] = []
    const pct65s: number[] = []
    
    geojson.features.forEach(feature => {
      const props = feature.properties as Record<string, unknown>
      const plrId = (props['PLR_ID'] || '') as string
      
      if (!plrId) return
      
      const density = (props['density'] as number) || 0
      const population = (props['population'] as number) || 0
      const pct_0_14 = (props['pct_0_14'] as number) || 0
      const pct_15_64 = (props['pct_15_64'] as number) || 0
      const pct_65_plus = (props['pct_65_plus'] as number) || 0
      
      densities.push(density)
      populations.push(population)
      pct014s.push(pct_0_14)
      pct1564s.push(pct_15_64)
      pct65s.push(pct_65_plus)
      
      areas[plrId] = {
        PLR_ID: plrId,
        PLR_NAME: props['PLR_NAME'] || '',
        BZR_ID: props['BZR_ID'] || '',
        BZR_NAME: props['BZR_NAME'] || '',
        BEZ_ID: props['BEZ_ID'] || '',
        BEZ_NAME: props['BEZ_NAME'] || '',
        population,
        density,
        pct_0_14,
        pct_15_64,
        pct_65_plus,
        // Percentiles calculated below
      }
    })
    
    // Calculate percentiles and add to areas
    const calcPercentile = (value: number, sortedArr: number[]) => {
      let count = 0
      for (const v of sortedArr) {
        if (v < value) count++
      }
      return (count / sortedArr.length) * 100
    }
    
    const sortedDensities = [...densities].sort((a, b) => a - b)
    const sortedPopulations = [...populations].sort((a, b) => a - b)
    const sortedPct014 = [...pct014s].sort((a, b) => a - b)
    const sortedPct1564 = [...pct1564s].sort((a, b) => a - b)
    const sortedPct65 = [...pct65s].sort((a, b) => a - b)
    
    Object.values(areas).forEach(area => {
      area['density_percentile'] = calcPercentile(area['density'] as number, sortedDensities)
      area['population_percentile'] = calcPercentile(area['population'] as number, sortedPopulations)
      area['pct_0_14_percentile'] = calcPercentile(area['pct_0_14'] as number, sortedPct014)
      area['pct_15_64_percentile'] = calcPercentile(area['pct_15_64'] as number, sortedPct1564)
      area['pct_65_plus_percentile'] = calcPercentile(area['pct_65_plus'] as number, sortedPct65)
    })
    
    // Calculate Berlin stats
    const getMedian = (arr: number[]) => arr[Math.floor(arr.length / 2)] || 0
    const getP25 = (arr: number[]) => arr[Math.floor(arr.length * 0.25)] || 0
    const getP75 = (arr: number[]) => arr[Math.floor(arr.length * 0.75)] || 0
    
    const profiles = {
      metadata: {
        generated: new Date().toISOString(),
        source_date: '2024-12-31',
        total_areas: Object.keys(areas).length,
      },
      berlin_stats: {
        population: populations.reduce((sum, p) => sum + p, 0),
        total_areas: Object.keys(areas).length,
        density_median: Math.round(getMedian(sortedDensities)),
        density_p25: Math.round(getP25(sortedDensities)),
        density_p75: Math.round(getP75(sortedDensities)),
        density_min: Math.round(sortedDensities[0] || 0),
        density_max: Math.round(sortedDensities[sortedDensities.length - 1] || 0),
        pct_0_14_median: Math.round(getMedian(sortedPct014) * 10) / 10,
        pct_15_64_median: Math.round(getMedian(sortedPct1564) * 10) / 10,
        pct_65_plus_median: Math.round(getMedian(sortedPct65) * 10) / 10,
      },
      areas,
    }
    
    writeFileSync(OUTPUT_PROFILES, JSON.stringify(profiles, null, 2))
    console.log(`Written profiles to ${OUTPUT_PROFILES}`)
    
    console.log('\nBerlin Stats:')
    console.log(`- Population: ${profiles.berlin_stats.population.toLocaleString()}`)
    console.log(`- Median density: ${profiles.berlin_stats.density_median.toLocaleString()} /km²`)
    console.log(`- Areas: ${profiles.berlin_stats.total_areas}`)
    
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()

