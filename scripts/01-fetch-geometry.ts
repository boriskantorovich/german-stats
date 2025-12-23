/**
 * Script to fetch LOR geometry from Berlin's WFS service
 * 
 * Run with: npx tsx scripts/01-fetch-geometry.ts
 */

import { writeFileSync, mkdirSync } from 'fs'
import { fetchPlanungsraeume } from './lib/wfs-client'

const OUTPUT_DIR = 'data/raw'
const OUTPUT_FILE = `${OUTPUT_DIR}/lor-planungsraeume.geojson`

async function main() {
  console.log('Fetching LOR Planungsräume from WFS...')
  
  try {
    // Create output directory
    mkdirSync(OUTPUT_DIR, { recursive: true })
    
    // Fetch geometry
    const geojson = await fetchPlanungsraeume()
    
    console.log(`Fetched ${geojson.features.length} features`)
    
    // Write to file
    writeFileSync(OUTPUT_FILE, JSON.stringify(geojson, null, 2))
    console.log(`Written to ${OUTPUT_FILE}`)
    
    // Log sample feature properties
    if (geojson.features.length > 0) {
      const sample = geojson.features[0]
      console.log('\nSample feature properties:')
      console.log(JSON.stringify(sample?.properties, null, 2))
    }
    
  } catch (error) {
    console.error('Error fetching geometry:', error)
    process.exit(1)
  }
}

main()

