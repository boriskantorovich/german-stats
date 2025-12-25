/**
 * Shared demographics calculation utilities
 * Used by both Planungsraum and Bezirk processing scripts
 */

import type { parseGermanNumber } from './csv-parser'

export interface RawDemographicData {
  E_E: string          // Total population
  E_EM: string         // Male
  E_EW: string         // Female
  // Detailed age bands
  E_E00_01: string
  E_E01_02: string
  E_E02_03: string
  E_E03_05: string
  E_E05_06: string
  E_E06_07: string
  E_E07_08: string
  E_E08_10: string
  E_E10_12: string
  E_E12_14: string
  E_E14_15: string
  E_E15_18: string
  E_E18_21: string
  E_E21_25: string
  E_E25_27: string
  E_E27_30: string
  E_E30_35: string
  E_E35_40: string
  E_E40_45: string
  E_E45_50: string
  E_E50_55: string
  E_E55_60: string
  E_E60_63: string
  E_E63_65: string
  E_E65_67: string
  E_E67_70: string
  E_E70_75: string
  E_E75_80: string
  E_E80_85: string
  E_E85_90: string
  E_E90_95: string
  E_E95_110: string
  // Pre-aggregated bands
  E_EU1: string
  E_E1U6: string
  E_E6U15: string
  E_E15U18: string
  E_E18U25: string
  E_E25U55: string
  E_E55U65: string
  E_E65U80: string
  E_E80U110: string
}

export interface DemographicMetrics {
  // Core
  population: number
  pop_male: number
  pop_female: number
  
  // Gender metrics
  pct_male: number
  pct_female: number
  sex_ratio: number  // males per 100 females
  
  // Broad age groups
  pop_0_14: number
  pop_15_64: number
  pop_65_plus: number
  pct_0_14: number
  pct_15_64: number
  pct_65_plus: number
  
  // Granular age bands
  pop_0_5: number
  pop_6_14: number
  pop_15_17: number
  pop_18_24: number
  pop_25_34: number
  pop_35_44: number
  pop_45_54: number
  pop_55_64: number
  pop_65_79: number
  pop_80_plus: number
  
  pct_0_5: number
  pct_6_14: number
  pct_15_17: number
  pct_18_24: number
  pct_25_34: number
  pct_35_44: number
  pct_45_54: number
  pct_55_64: number
  pct_65_79: number
  pct_80_plus: number
  
  // Aging intensity
  aging_index: number        // (65+ / 0-14) * 100
  dependency_ratio: number   // ((0-14 + 65+) / 15-64) * 100
  elderly_dependency: number // (65+ / 15-64) * 100
  youth_dependency: number   // (0-14 / 15-64) * 100
}

type Parser = typeof parseGermanNumber

/**
 * Calculate all demographic metrics from raw CSV data
 */
export function calculateDemographics(
  data: RawDemographicData,
  parse: Parser
): DemographicMetrics {
  // Core populations
  const population = parse(data.E_E || '0')
  const pop_male = parse(data.E_EM || '0')
  const pop_female = parse(data.E_EW || '0')
  
  // Granular age bands (built from detailed columns)
  const pop_0_5 = 
    parse(data.E_E00_01 || '0') +
    parse(data.E_E01_02 || '0') +
    parse(data.E_E02_03 || '0') +
    parse(data.E_E03_05 || '0') +
    parse(data.E_E05_06 || '0')
  
  const pop_6_14 = 
    parse(data.E_E06_07 || '0') +
    parse(data.E_E07_08 || '0') +
    parse(data.E_E08_10 || '0') +
    parse(data.E_E10_12 || '0') +
    parse(data.E_E12_14 || '0') +
    parse(data.E_E14_15 || '0')
  
  const pop_15_17 = parse(data.E_E15_18 || '0')
  
  const pop_18_24 = 
    parse(data.E_E18_21 || '0') +
    parse(data.E_E21_25 || '0')
  
  const pop_25_34 = 
    parse(data.E_E25_27 || '0') +
    parse(data.E_E27_30 || '0') +
    parse(data.E_E30_35 || '0')
  
  const pop_35_44 = 
    parse(data.E_E35_40 || '0') +
    parse(data.E_E40_45 || '0')
  
  const pop_45_54 = 
    parse(data.E_E45_50 || '0') +
    parse(data.E_E50_55 || '0')
  
  const pop_55_64 = 
    parse(data.E_E55_60 || '0') +
    parse(data.E_E60_63 || '0') +
    parse(data.E_E63_65 || '0')
  
  const pop_65_79 = 
    parse(data.E_E65_67 || '0') +
    parse(data.E_E67_70 || '0') +
    parse(data.E_E70_75 || '0') +
    parse(data.E_E75_80 || '0')
  
  const pop_80_plus = 
    parse(data.E_E80_85 || '0') +
    parse(data.E_E85_90 || '0') +
    parse(data.E_E90_95 || '0') +
    parse(data.E_E95_110 || '0')
  
  // Broad age groups (aggregate from granular)
  const pop_0_14 = pop_0_5 + pop_6_14
  const pop_15_64 = pop_15_17 + pop_18_24 + pop_25_34 + pop_35_44 + pop_45_54 + pop_55_64
  const pop_65_plus = pop_65_79 + pop_80_plus
  
  // Gender percentages and ratio
  const pct_male = population > 0 ? (pop_male / population) * 100 : 0
  const pct_female = population > 0 ? (pop_female / population) * 100 : 0
  const sex_ratio = pop_female > 0 ? (pop_male / pop_female) * 100 : 0
  
  // Age percentages - broad
  const pct_0_14 = population > 0 ? (pop_0_14 / population) * 100 : 0
  const pct_15_64 = population > 0 ? (pop_15_64 / population) * 100 : 0
  const pct_65_plus = population > 0 ? (pop_65_plus / population) * 100 : 0
  
  // Age percentages - granular
  const pct_0_5 = population > 0 ? (pop_0_5 / population) * 100 : 0
  const pct_6_14 = population > 0 ? (pop_6_14 / population) * 100 : 0
  const pct_15_17 = population > 0 ? (pop_15_17 / population) * 100 : 0
  const pct_18_24 = population > 0 ? (pop_18_24 / population) * 100 : 0
  const pct_25_34 = population > 0 ? (pop_25_34 / population) * 100 : 0
  const pct_35_44 = population > 0 ? (pop_35_44 / population) * 100 : 0
  const pct_45_54 = population > 0 ? (pop_45_54 / population) * 100 : 0
  const pct_55_64 = population > 0 ? (pop_55_64 / population) * 100 : 0
  const pct_65_79 = population > 0 ? (pop_65_79 / population) * 100 : 0
  const pct_80_plus = population > 0 ? (pop_80_plus / population) * 100 : 0
  
  // Dependency ratios
  const aging_index = pop_0_14 > 0 ? (pop_65_plus / pop_0_14) * 100 : 0
  const dependency_ratio = pop_15_64 > 0 ? ((pop_0_14 + pop_65_plus) / pop_15_64) * 100 : 0
  const elderly_dependency = pop_15_64 > 0 ? (pop_65_plus / pop_15_64) * 100 : 0
  const youth_dependency = pop_15_64 > 0 ? (pop_0_14 / pop_15_64) * 100 : 0
  
  return {
    population,
    pop_male,
    pop_female,
    pct_male,
    pct_female,
    sex_ratio,
    pop_0_14,
    pop_15_64,
    pop_65_plus,
    pct_0_14,
    pct_15_64,
    pct_65_plus,
    pop_0_5,
    pop_6_14,
    pop_15_17,
    pop_18_24,
    pop_25_34,
    pop_35_44,
    pop_45_54,
    pop_55_64,
    pop_65_79,
    pop_80_plus,
    pct_0_5,
    pct_6_14,
    pct_15_17,
    pct_18_24,
    pct_25_34,
    pct_35_44,
    pct_45_54,
    pct_55_64,
    pct_65_79,
    pct_80_plus,
    aging_index,
    dependency_ratio,
    elderly_dependency,
    youth_dependency,
  }
}

/**
 * Aggregate demographics from multiple areas
 */
export function aggregateDemographics(
  areas: DemographicMetrics[]
): DemographicMetrics {
  // Sum all populations
  const population = areas.reduce((sum, a) => sum + a.population, 0)
  const pop_male = areas.reduce((sum, a) => sum + a.pop_male, 0)
  const pop_female = areas.reduce((sum, a) => sum + a.pop_female, 0)
  
  // Sum age bands
  const pop_0_5 = areas.reduce((sum, a) => sum + a.pop_0_5, 0)
  const pop_6_14 = areas.reduce((sum, a) => sum + a.pop_6_14, 0)
  const pop_15_17 = areas.reduce((sum, a) => sum + a.pop_15_17, 0)
  const pop_18_24 = areas.reduce((sum, a) => sum + a.pop_18_24, 0)
  const pop_25_34 = areas.reduce((sum, a) => sum + a.pop_25_34, 0)
  const pop_35_44 = areas.reduce((sum, a) => sum + a.pop_35_44, 0)
  const pop_45_54 = areas.reduce((sum, a) => sum + a.pop_45_54, 0)
  const pop_55_64 = areas.reduce((sum, a) => sum + a.pop_55_64, 0)
  const pop_65_79 = areas.reduce((sum, a) => sum + a.pop_65_79, 0)
  const pop_80_plus = areas.reduce((sum, a) => sum + a.pop_80_plus, 0)
  
  // Recalculate broad groups
  const pop_0_14 = pop_0_5 + pop_6_14
  const pop_15_64 = pop_15_17 + pop_18_24 + pop_25_34 + pop_35_44 + pop_45_54 + pop_55_64
  const pop_65_plus = pop_65_79 + pop_80_plus
  
  // Recalculate all derived metrics
  const pct_male = population > 0 ? (pop_male / population) * 100 : 0
  const pct_female = population > 0 ? (pop_female / population) * 100 : 0
  const sex_ratio = pop_female > 0 ? (pop_male / pop_female) * 100 : 0
  
  const pct_0_14 = population > 0 ? (pop_0_14 / population) * 100 : 0
  const pct_15_64 = population > 0 ? (pop_15_64 / population) * 100 : 0
  const pct_65_plus = population > 0 ? (pop_65_plus / population) * 100 : 0
  
  const pct_0_5 = population > 0 ? (pop_0_5 / population) * 100 : 0
  const pct_6_14 = population > 0 ? (pop_6_14 / population) * 100 : 0
  const pct_15_17 = population > 0 ? (pop_15_17 / population) * 100 : 0
  const pct_18_24 = population > 0 ? (pop_18_24 / population) * 100 : 0
  const pct_25_34 = population > 0 ? (pop_25_34 / population) * 100 : 0
  const pct_35_44 = population > 0 ? (pop_35_44 / population) * 100 : 0
  const pct_45_54 = population > 0 ? (pop_45_54 / population) * 100 : 0
  const pct_55_64 = population > 0 ? (pop_55_64 / population) * 100 : 0
  const pct_65_79 = population > 0 ? (pop_65_79 / population) * 100 : 0
  const pct_80_plus = population > 0 ? (pop_80_plus / population) * 100 : 0
  
  const aging_index = pop_0_14 > 0 ? (pop_65_plus / pop_0_14) * 100 : 0
  const dependency_ratio = pop_15_64 > 0 ? ((pop_0_14 + pop_65_plus) / pop_15_64) * 100 : 0
  const elderly_dependency = pop_15_64 > 0 ? (pop_65_plus / pop_15_64) * 100 : 0
  const youth_dependency = pop_15_64 > 0 ? (pop_0_14 / pop_15_64) * 100 : 0
  
  return {
    population,
    pop_male,
    pop_female,
    pct_male,
    pct_female,
    sex_ratio,
    pop_0_14,
    pop_15_64,
    pop_65_plus,
    pct_0_14,
    pct_15_64,
    pct_65_plus,
    pop_0_5,
    pop_6_14,
    pop_15_17,
    pop_18_24,
    pop_25_34,
    pop_35_44,
    pop_45_54,
    pop_55_64,
    pop_65_79,
    pop_80_plus,
    pct_0_5,
    pct_6_14,
    pct_15_17,
    pct_18_24,
    pct_25_34,
    pct_35_44,
    pct_45_54,
    pct_55_64,
    pct_65_79,
    pct_80_plus,
    aging_index,
    dependency_ratio,
    elderly_dependency,
    youth_dependency,
  }
}

