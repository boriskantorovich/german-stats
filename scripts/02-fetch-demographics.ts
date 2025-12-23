/**
 * Script to fetch population demographics from Berlin Open Data
 * 
 * Run with: npx tsx scripts/02-fetch-demographics.ts
 */

import { writeFileSync, mkdirSync } from 'fs'

const OUTPUT_DIR = 'data/raw'
const OUTPUT_FILE = `${OUTPUT_DIR}/population-2024.csv`

// Population data by age groups for LOR Planungsräume
const CSV_URL = 'https://www.statistik-berlin-brandenburg.de/opendata/EWR_L21_202412E_Matrix.csv'

async function main() {
  console.log('Fetching population demographics...')
  
  try {
    // Create output directory
    mkdirSync(OUTPUT_DIR, { recursive: true })
    
    // Fetch CSV
    console.log(`Downloading from: ${CSV_URL}`)
    const response = await fetch(CSV_URL)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`)
    }
    
    const csvText = await response.text()
    
    // Write to file
    writeFileSync(OUTPUT_FILE, csvText)
    console.log(`Written to ${OUTPUT_FILE}`)
    
    // Count lines
    const lines = csvText.trim().split('\n')
    console.log(`Total lines: ${lines.length}`)
    
    // Show header
    if (lines.length > 0) {
      console.log('\nCSV Header:')
      console.log(lines[0])
    }
    
  } catch (error) {
    console.error('Error fetching demographics:', error)
    process.exit(1)
  }
}

main()

