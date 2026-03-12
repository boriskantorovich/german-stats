# City Data Availability Analysis

## Available Data Fields by City

### Berlin (542 areas)
**Source**: LOR Planungsräume  
**Fields**: ✅ Full dataset
- `population` ✅
- `density` ✅
- `pct_0_14`, `pct_15_64`, `pct_65_plus` ✅
- `pct_male`, `pct_female`, `sex_ratio` ✅
- All age bands (0-5, 6-14, 15-17, 18-24, etc.) ✅
- Derived indicators (aging_index, dependency_ratio, etc.) ✅

### Hamburg (104 areas)
**Source**: Stadtteile  
**Fields**: ❌ **Limited**
- `population` ✅
- `population_percentile` ✅
- `density` ❌ **MISSING**
- Age breakdowns ❌ **MISSING**
- Gender data ❌ **MISSING**

### Munich (25 areas)
**Source**: Stadtbezirke  
**Fields**: ✅ **Partial**
- `population` ✅
- `population_density` ✅
- `population_percentile` ✅
- `density_percentile` ✅
- `area_hectares` ✅
- Age breakdowns ❌ **MISSING**
- Gender data ❌ **MISSING**

---

## Current Layer Options (8 layers shown)

1. 👥 **Population Density** 
   - ✅ Berlin: YES
   - ❌ Hamburg: NO (not calculated)
   - ✅ Munich: YES

2. 👴 **Elderly (65+)**
   - ✅ Berlin: YES
   - ❌ Hamburg: NO
   - ❌ Munich: NO

3. 👶 **Youth (0-14)**
   - ✅ Berlin: YES
   - ❌ Hamburg: NO
   - ❌ Munich: NO

4. 📊 **Total Population**
   - ✅ Berlin: YES
   - ✅ Hamburg: YES
   - ✅ Munich: YES

5. ⚖️ **Sex Ratio**
   - ✅ Berlin: YES
   - ❌ Hamburg: NO
   - ❌ Munich: NO

6. 📈 **Aging Index**
   - ✅ Berlin: YES
   - ❌ Hamburg: NO
   - ❌ Munich: NO

7. 🎓 **Young Adults (18-24)**
   - ✅ Berlin: YES
   - ❌ Hamburg: NO
   - ❌ Munich: NO

8. 👵 **Very Elderly (80+)**
   - ✅ Berlin: YES
   - ❌ Hamburg: NO
   - ❌ Munich: NO

---

## Problems Identified

### 1. ❌ Layers shown but data unavailable
Hamburg and Munich users see 8 layer options but only 1-2 actually work!

### 2. ❌ No city-specific layer filtering
The UI doesn't adapt to what data is available for each city.

### 3. ❌ Misleading tooltips
Hovering shows "No data" for unavailable indicators - users don't know if it's:
- Missing data for this specific district?
- Unavailable for the entire city?

### 4. ❌ Munich has density but we don't use it
Munich has `population_density` field but we look for `density`.

---

## Solutions

### Option A: Hide Unavailable Layers (Recommended)
Only show layers that have data for the current city.

**Pros:**
- Clean UX
- No confusion
- Automatic adaptation

**Cons:**
- Different cities show different UI
- Users might wonder where layers went

### Option B: Disable Unavailable Layers
Show all layers but gray out unavailable ones with tooltip explaining why.

**Pros:**
- Consistent UI across cities
- Educational (users learn what data exists)

**Cons:**
- Cluttered
- More complex implementation

### Option C: Calculate Missing Data
For Hamburg, calculate density from population + area.

**Pros:**
- More consistent experience
- Hamburg gets density layer

**Cons:**
- Need to add area calculation
- Still missing age/gender data

---

## Recommended Implementation

### Phase 1: City-Specific Layer Filtering ✅
```typescript
const CITY_AVAILABLE_LAYERS = {
  berlin: ['density', 'pct_65_plus', 'pct_0_14', 'population', 'sex_ratio', 'aging_index', 'pct_18_24', 'pct_80_plus'],
  hamburg: ['population'],
  munich: ['population', 'density'],
}
```

### Phase 2: Fix Munich Density Field Mapping
Map Munich's `population_density` to `density` in the GeoJSON.

### Phase 3: Calculate Hamburg Density
Add area calculation to Hamburg processing script.

### Phase 4: Better Feedback
When switching cities, show a notification:
- "Hamburg data: Population only"
- "Munich data: Population & Density"
- "Berlin data: Full demographic analysis"

---

## Neighborhood/District Toggle Issue

### Current Situation
- **Berlin**: Has 2 admin levels (Planungsräume 542 + Bezirke 12)
- **Hamburg**: Single level (Stadtteile 104)
- **Munich**: Single level (Stadtbezirke 25)

### Problem
The "Neighborhoods / Districts" toggle is shown for all cities but only works for Berlin!

### Solutions

#### Option 1: Hide for Single-Level Cities (Recommended)
```typescript
const showAdminToggle = cityId === 'berlin'
```

#### Option 2: Rename Dynamically
- Berlin: "Neighborhoods (542) / Districts (12)"
- Hamburg: "Stadtteile (104)" (no toggle)
- Munich: "Stadtbezirke (25)" (no toggle)

#### Option 3: Add Second Level Data for Hamburg/Munich
Research if Hamburg/Munich have hierarchical data we can use.
- Hamburg: Already has `bezirk_name` in geodata! (7 Bezirke)
- Munich: Flat structure only

---

## Final Recommendations

### Immediate (Priority 1)
1. ✅ **Fix Munich density field name** (`population_density` → `density`)
2. ✅ **Filter layers by city availability**
3. ✅ **Hide admin toggle for Hamburg/Munich**

### Short-term (Priority 2)
4. ⚠️ **Calculate Hamburg density** from population + area
5. ⚠️ **Add Hamburg Bezirke level** (7 districts available in data)
6. ⚠️ **Show city data capabilities** in UI

### Long-term (Priority 3)
7. 🔄 **Find/integrate age data for Hamburg**
8. 🔄 **Find/integrate age data for Munich**
9. 🔄 **Add more German cities**


