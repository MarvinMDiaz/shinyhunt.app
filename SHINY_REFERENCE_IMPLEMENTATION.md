# Shiny Reference Implementation

This document describes the shiny reference data layer and related improvements to the ShinyHunt app.

## Overview

The app now includes a comprehensive shiny reference system based on PokémonDB's shiny dex coverage, with theoretical odds calculations and support for future community data integration.

## Files Created

### 1. `src/lib/shinyReference.ts`
- Reference data layer for shiny Pokémon validation
- Generation mapping (Gen 1-9, up to Pokémon #1025)
- Helper functions for validation and display names
- **Note**: Uses PokéAPI for actual sprites, not PokémonDB images

### 2. `src/lib/oddsCalculator.ts`
- Theoretical shiny odds calculations
- Expected attempts: `1 / odds`
- Probability thresholds: 50%, 90%, 95%, 99%
- Probability within N attempts calculation

### 3. `src/lib/communityData.ts`
- Data model for community hunt logs
- Statistics calculation (average, median, sample size, best/worst)
- Placeholder for future CSV/JSON import
- **Note**: Community data is optional and not yet populated

## Files Updated

### 1. `src/components/Statistics.tsx`
**Changes:**
- Added "Theoretical Shiny Odds (odds-based)" section
- Shows expected attempts, 50%/90%/95% thresholds
- Added optional "Observed Average (community data)" section
- Clear labeling: "Expected attempts (odds-based)" vs "Observed average (community data)"
- Note: "No species-specific average available without hunt log data"

**Key Features:**
- Theoretical calculations based on probability theory
- Clear distinction between theoretical and observed data
- Community data integration ready (when data is available)

### 2. `src/lib/pokeapi.ts`
**Changes:**
- Enhanced `searchPokemon` to support dex number search (e.g., "#25" or "25")
- Improved form/variation fetching
- Better deduplication of results

### 3. `src/components/PokemonSearch.tsx`
**Changes:**
- Updated placeholder text to mention dex number search
- Better form name display

### 4. `src/components/ShinyDex.tsx`
**Changes:**
- Uses shiny reference validation
- Improved visual feedback:
  - Completed: Full color shiny sprite with trophy and sparkle badges
  - Unrevealed: Greyed-out base sprite with dex number
- Better hover states and transitions
- Updated description text

### 5. `src/types/index.ts`
**Changes:**
- Added `formName` and `displayName` to Pokemon interface

## Key Features

### 1. Theoretical Odds Section
The Statistics component now clearly shows:
- **Expected attempts**: `1 / odds` (theoretical average)
- **50% chance by**: Number of attempts for 50% probability
- **90% chance by**: Number of attempts for 90% probability
- **95% chance by**: Number of attempts for 95% probability

All calculations are based on probability theory, not species-specific data.

### 2. Community Data Support (Ready for Future)
The system is prepared to accept community hunt logs:
- Data model defined in `communityData.ts`
- Statistics component ready to display observed averages
- CSV/JSON import function placeholder ready

When community data is available:
- Shows observed average, median, sample size, best/worst
- Clearly labeled as "Observed Average (community data)"
- Falls back to theoretical odds if no data exists

### 3. Shiny Reference Validation
- Validates Pokémon IDs against shiny dex coverage (1-1025)
- Generation mapping for organization
- Form name support for variations

### 4. Improved Search
- Search by name: "pikachu"
- Search by dex number: "#25" or "25"
- Search by ID: "25"
- Form variations included in results

## UI Copy Guidelines

The app uses clear, accurate wording:
- ✅ "Expected attempts (odds-based)" - Theoretical calculation
- ✅ "Observed average (community data)" - Real hunt data
- ✅ "No species-specific average available without hunt log data" - When no data exists
- ❌ Avoid: "Average for this Pokémon" (unless community data exists)

## Future Enhancements

1. **Community Data Import**
   - Implement CSV/JSON parsing in `importCommunityData()`
   - Add UI for importing community hunt logs
   - Store in localStorage or fetch from API

2. **Extended Form Support**
   - Add more form variations (regional forms, etc.)
   - Better form name formatting

3. **Generation Filtering**
   - Filter Shiny Dex by generation
   - Group by generation in trophy case

## Notes

- **PokémonDB Reference**: Used only as a reference for coverage and names
- **Image Sources**: All images come from PokéAPI, not PokémonDB
- **Offline Support**: System works even if PokémonDB is unavailable
- **Data Validation**: All Pokémon IDs validated against shiny reference
