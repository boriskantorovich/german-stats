#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

console.log('🏙️  Processing Munich data...\n');

// Read geodata
const geoPath = 'data/raw/munich/stadtbezirke.geojson';
const geodata = JSON.parse(fs.readFileSync(geoPath, 'utf-8'));

console.log(`✅ Loaded ${geodata.features.length} Stadtbezirke from geodata`);

// Read demographics CSV
const demoPath = 'data/raw/munich/demographics.csv';
const demoLines = fs.readFileSync(demoPath, 'utf-8').split('\n').filter(line => line.trim());

// Parse CSV manually (simple format)
const headers = demoLines[0].split(',');
const demographics = {};

for (let i = 1; i < demoLines.length; i++) {
  const line = demoLines[i];
  if (!line.trim()) continue;
  
  // Handle the special case where population might have spaces (like "101 901")
  const values = line.split(',').map(v => v.trim().replace(/\s+/g, ''));
  
  const nummer = values[0];
  if (nummer === '26') continue; // Skip "insgesamt" row
  
  // Pad to 2 digits with leading zero
  const paddedNummer = nummer.padStart(2, '0');
  
  demographics[paddedNummer] = {
    stadtbezirksnummer: nummer,
    stadtbezirk: values[1],
    population: parseInt(values[2]),
    area_hectares: parseFloat(values[4]),
    population_density: parseInt(values[6])
  };
}

console.log(`✅ Loaded demographics for ${Object.keys(demographics).length} Stadtbezirke`);

// Join data
let matched = 0;
let unmatched = 0;

geodata.features = geodata.features.map(feature => {
  const sbNummer = feature.properties.sb_nummer;
  const demo = demographics[sbNummer];
  
  if (demo) {
    matched++;
    return {
      ...feature,
      properties: {
        id: sbNummer,
        name: demo.stadtbezirk,
        population: demo.population,
        area_hectares: demo.area_hectares,
        density: demo.population_density,  // Rename to match Berlin's field name
        // Calculate percentiles (will do this after all features are processed)
        population_percentile: 0,
        density_percentile: 0
      }
    };
  } else {
    unmatched++;
    console.warn(`⚠️  No demographics found for Stadtbezirk ${sbNummer}: ${feature.properties.name}`);
    return feature;
  }
});

console.log(`\n📊 Join results:`);
console.log(`   ✅ Matched: ${matched}`);
console.log(`   ⚠️  Unmatched: ${unmatched}`);

// Calculate percentiles
const allPopulations = geodata.features
  .map(f => f.properties.population)
  .filter(p => p != null)
  .sort((a, b) => a - b);

const allDensities = geodata.features
  .map(f => f.properties.density)  // Use renamed field
  .filter(d => d != null)
  .sort((a, b) => a - b);

function calculatePercentile(value: number, sortedArray: number[]): number {
  const index = sortedArray.findIndex(v => v >= value);
  return (index / sortedArray.length) * 100;
}

geodata.features = geodata.features.map(feature => {
  if (feature.properties.population) {
    feature.properties.population_percentile = Math.round(
      calculatePercentile(feature.properties.population, allPopulations)
    );
  }
  if (feature.properties.density) {  // Use renamed field
    feature.properties.density_percentile = Math.round(
      calculatePercentile(feature.properties.density, allDensities)
    );
  }
  return feature;
});

// Save processed data
const outDir = 'data/processed/munich';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const outPath = path.join(outDir, 'with-data.geojson');
fs.writeFileSync(outPath, JSON.stringify(geodata, null, 2));

console.log(`\n✅ Saved processed data to: ${outPath}`);

// Generate profiles JSON
const profiles: any = {};

geodata.features.forEach(feature => {
  const props = feature.properties;
  profiles[props.id] = {
    id: props.id,
    name: props.name,
    population: props.population,
    area_hectares: props.area_hectares,
    population_density: props.population_density,
    population_percentile: props.population_percentile,
    density_percentile: props.density_percentile
  };
});

const profilesPath = path.join(outDir, 'profiles.json');
fs.writeFileSync(profilesPath, JSON.stringify(profiles, null, 2));

console.log(`✅ Saved profiles to: ${profilesPath}`);

console.log('\n🎉 Munich processing complete!');
console.log(`\n📊 Summary:`);
console.log(`   Districts: ${geodata.features.length}`);
console.log(`   Total Population: ${allPopulations.reduce((a, b) => a + b, 0).toLocaleString('de-DE')}`);
console.log(`   Avg Population: ${Math.round(allPopulations.reduce((a, b) => a + b, 0) / allPopulations.length).toLocaleString('de-DE')}`);
console.log(`   Avg Density: ${Math.round(allDensities.reduce((a, b) => a + b, 0) / allDensities.length)} per hectare`);

