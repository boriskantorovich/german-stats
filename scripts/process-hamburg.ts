#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

console.log('🏙️  Processing Hamburg data...\n');

// Read geodata (already downloaded)
const geoPath = 'data/raw/hamburg/stadtteile.geojson';
const geodata = JSON.parse(fs.readFileSync(geoPath, 'utf-8'));

console.log(`✅ Loaded ${geodata.features.length} Stadtteile from geodata`);

// Read demographics CSV (converted from GML)
const demoPath = 'data/raw/hamburg/demographics.csv';
const demoContent = fs.readFileSync(demoPath, 'utf-8');

// Parse the complex CSV format
// The CSV has JSON arrays embedded in cells for timeseries data
const lines = demoContent.split('\n').filter(line => line.trim());
const headers = lines[0].split(',');

console.log(`\n📋 Found ${headers.length} columns in demographics`);

// Find key column indices
const stadtteilIdIdx = headers.findIndex(h => h === 'stadtteil_id');
const stadtteilNameIdx = headers.findIndex(h => h === 'stadtteil_name');

console.log(`   stadtteil_id at index: ${stadtteilIdIdx}`);
console.log(`   stadtteil_name at index: ${stadtteilNameIdx}`);

// Function to extract 2023 value from timeseries
function extractLatestValue(keyStr: string, valueStr: string): number | null {
  if (!keyStr || !valueStr || keyStr === 'null' || valueStr === 'null') {
    return null;
  }
  
  try {
    // Parse the JSON arrays
    const keys = JSON.parse(keyStr.replace(/\s+/g, ' '));
    const values = JSON.parse(valueStr.replace(/\s+/g, ' '));
    
    // Find 2023 index
    const idx2023 = keys.findIndex((k: number) => k === 2023);
    if (idx2023 >= 0 && values[idx2023]) {
      const val = values[idx2023];
      // Handle German number format (comma as decimal separator)
      if (typeof val === 'string') {
        return parseFloat(val.replace(',', '.'));
      }
      return parseFloat(val);
    }
    
    // If no 2023, get most recent (first in array)
    if (values.length > 0 && values[0]) {
      const val = values[0];
      if (typeof val === 'string') {
        return parseFloat(val.replace(',', '.'));
      }
      return parseFloat(val);
    }
  } catch (e) {
    // Silent fail
  }
  
  return null;
}

// Parse demographics
const demographics: Record<string, any> = {};

for (let i = 1; i < Math.min(lines.length, 110); i++) {  // 104 Stadtteile + header
  const line = lines[i];
  if (!line.trim()) continue;
  
  // Split carefully (CSV has complex quoted fields)
  const cells: string[] = [];
  let currentCell = '';
  let inQuotes = false;
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      cells.push(currentCell);
      currentCell = '';
    } else {
      currentCell += char;
    }
  }
  cells.push(currentCell);  // Last cell
  
  const stadtteilId = cells[stadtteilIdIdx];
  const stadtteilName = cells[stadtteilNameIdx];
  
  if (!stadtteilId || stadtteilId === 'null') continue;
  
  // Find the values columns for population metrics
  // Look for anzahl_u18 values (index 29-30 based on structure)
  const anzahlU18KeyIdx = headers.findIndex(h => h === 'anzahl_u18|values|key');
  const anzahlU18ValIdx = headers.findIndex(h => h === 'anzahl_u18|values|value');
  
  const population = extractLatestValue(
    cells[anzahlU18KeyIdx],
    cells[anzahlU18ValIdx]
  );
  
  if (population) {
    demographics[stadtteilId] = {
      stadtteil_id: stadtteilId,
      stadtteil_name: stadtteilName,
      population: Math.round(population),
    };
  }
}

console.log(`✅ Parsed demographics for ${Object.keys(demographics).length} Stadtteile`);

// Join data
let matched = 0;
let unmatched = 0;

geodata.features = geodata.features.map((feature: any) => {
  const stadtteilId = feature.properties.stadtteil_nummer;
  const demo = demographics[stadtteilId];
  
  if (demo && demo.population) {
    matched++;
    return {
      ...feature,
      properties: {
        id: stadtteilId,
        name: demo.stadtteil_name || feature.properties.stadtteil_name || feature.properties.name,
        population: demo.population,
        population_percentile: 0,  // Calculate below
      }
    };
  } else {
    unmatched++;
    // Keep the feature but with no population data (for port/industrial areas)
    return {
      ...feature,
      properties: {
        id: stadtteilId,
        name: feature.properties.stadtteil_name || feature.properties.name,
        population: 0,  // No population data
        population_percentile: 0,
      }
    };
  }
});

console.log(`\n📊 Join results:`);
console.log(`   ✅ Matched: ${matched}`);
console.log(`   ⚠️  Unmatched: ${unmatched}`);

// Calculate percentiles
const allPopulations = geodata.features
  .map((f: any) => f.properties.population)
  .filter((p: number) => p != null)
  .sort((a: number, b: number) => a - b);

function calculatePercentile(value: number, sortedArray: number[]): number {
  const index = sortedArray.findIndex(v => v >= value);
  return (index / sortedArray.length) * 100;
}

geodata.features = geodata.features.map((feature: any) => {
  if (feature.properties.population) {
    feature.properties.population_percentile = Math.round(
      calculatePercentile(feature.properties.population, allPopulations)
    );
  }
  return feature;
});

// Save processed data
const outDir = 'data/processed/hamburg';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const outPath = path.join(outDir, 'with-data.geojson');
fs.writeFileSync(outPath, JSON.stringify(geodata, null, 2));

console.log(`\n✅ Saved processed data to: ${outPath}`);

// Generate profiles JSON
const profiles: any = {};

geodata.features.forEach((feature: any) => {
  const props = feature.properties;
  profiles[props.id] = {
    id: props.id,
    name: props.name,
    population: props.population,
    population_percentile: props.population_percentile,
  };
});

const profilesPath = path.join(outDir, 'profiles.json');
fs.writeFileSync(profilesPath, JSON.stringify(profiles, null, 2));

console.log(`✅ Saved profiles to: ${profilesPath}`);

console.log('\n🎉 Hamburg processing complete!');
console.log(`\n📊 Summary:`);
console.log(`   Districts: ${geodata.features.length}`);
console.log(`   Total Population: ${allPopulations.reduce((a: number, b: number) => a + b, 0).toLocaleString('de-DE')}`);
console.log(`   Avg Population: ${Math.round(allPopulations.reduce((a: number, b: number) => a + b, 0) / allPopulations.length).toLocaleString('de-DE')}`);

