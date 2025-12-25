/**
 * Script to verify LOR 2021 geometry file exists
 * 
 * LOR 2021 geometry must be downloaded and converted manually.
 * See DATA_SOURCES.md for detailed instructions.
 * 
 * Run with: npx tsx scripts/01-fetch-geometry.ts
 */

import { mkdirSync, existsSync, readFileSync } from 'fs'

const OUTPUT_DIR = 'data/raw'
const OUTPUT_FILE = `${OUTPUT_DIR}/lor-planungsraeume.geojson`

// LOR 2021 Shapefile download URL (requires manual conversion)
const SHAPEFILE_URL = 'https://www.berlin.de/sen/sbw/_assets/stadtdaten/stadtwissen/lebensweltlich-orientierte-raeume/lor_2021-01-01_k3_shapefiles_nur_id.7z'

function showDownloadInstructions(): void {
  console.log('')
  console.log('❌ LOR 2021 geometry file not found')
  console.log('')
  console.log('📦 Download and convert manually:')
  console.log('')
  console.log('   # 1. Install required tools (if not already installed)')
  console.log('   brew install p7zip gdal  # macOS')
  console.log('   # sudo apt install p7zip-full gdal-bin  # Linux')
  console.log('')
  console.log('   # 2. Download Shapefile (805 KB)')
  console.log(`   curl -O "${SHAPEFILE_URL}"`)
  console.log('')
  console.log('   # 3. Extract archive')
  console.log('   7z x lor_2021-01-01_k3_shapefiles_nur_id.7z')
  console.log('')
  console.log('   # 4. Convert to GeoJSON')
  console.log('   ogr2ogr -f GeoJSON -t_srs EPSG:4326 \\')
  console.log('     data/raw/lor-planungsraeume.geojson \\')
  console.log('     lor_planungsraeume_2021.shp')
  console.log('')
  console.log('   # 5. Verify file')
  console.log('   npx tsx scripts/01-fetch-geometry.ts')
  console.log('')
  console.log('For more details, see: DATA_SOURCES.md')
  console.log('')
}

function main() {
  try {
    // Create output directory
    mkdirSync(OUTPUT_DIR, { recursive: true })
    
    // Check if GeoJSON exists
    if (!existsSync(OUTPUT_FILE)) {
      showDownloadInstructions()
      process.exit(1)
    }
    
    // File exists - validate it
    console.log('✅ LOR geometry file found')
    const geojson = JSON.parse(readFileSync(OUTPUT_FILE, 'utf-8'))
    console.log(`   ${geojson.features.length} features in ${OUTPUT_FILE}`)
    
    // Verify it's LOR 2021 (should have 542 areas)
    if (geojson.features.length === 542) {
      console.log('   ✅ Correct: 542 Planungsräume (LOR 2021)')
    } else if (geojson.features.length === 447) {
      console.log('   ⚠️  Warning: 447 features detected (LOR 2006 - outdated)')
      console.log('   Expected: 542 features (LOR 2021)')
      console.log('')
      console.log('   Download LOR 2021 instead. See: DATA_SOURCES.md')
      process.exit(1)
    } else {
      console.log(`   ⚠️  Warning: Expected 542 features, found ${geojson.features.length}`)
      process.exit(1)
    }
    
    // Show sample properties
    if (geojson.features.length > 0) {
      const sample = geojson.features[0]
      console.log('')
      console.log('Sample feature properties:')
      console.log(JSON.stringify(sample?.properties, null, 2))
    }
    
    console.log('')
    console.log('✅ Ready for next step: npx tsx scripts/02-fetch-demographics.ts')
    
  } catch (error) {
    console.error('Error reading geometry file:', error)
    process.exit(1)
  }
}

main()

