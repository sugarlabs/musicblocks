# Temperament Integration E2E Test

## Overview

This test suite (`temperament-integration.cy.js`) demonstrates the complete temperament integration workflow in Music Blocks, showcasing how all temperament features work together.

## Test Cases

### 1. Complete 31-EDO Temperament Workflow

**Purpose:** Demonstrates full microtonal music creation workflow

**Steps:**

1. Sets temperament to 31-EDO (31 Equal Divisions of Octave)
2. Verifies temperament length returns 31
3. Defines custom mode with pitch numbers > 11 (testing modulo arithmetic)
4. Tests Nth Modal Pitch with custom temperament
5. Verifies audio synthesis works with microtonal intervals

**Key Features Tested:**

-   Set Temperament block functionality
-   Temperament Length block accuracy
-   Define Mode with dynamic pitch number wrapping
-   Nth Modal Pitch calculations in custom temperament
-   Audio context initialization and playback

### 2. Temperament Switching Test

**Purpose:** Verifies system handles temperament changes correctly

**Steps:**

1. Switches from 31-EDO to 5-EDO
2. Verifies temperament length updates to 5
3. Confirms no errors during switching

### 3. Define Mode Wrapping Test

**Purpose:** Specifically tests modulo arithmetic with edge cases

**Steps:**

1. Uses pitch number 40 in 31-EDO (should wrap to 9)
2. Verifies no "invalid pitch number" errors
3. Confirms wrapping logic works correctly

## Running the Tests

```bash
# Start the Music Blocks server
npm run serve

# Run all e2e tests (includes temperament integration)
npm run cypress:run

# Run only temperament tests
npx cypress run --spec "cypress/e2e/temperament-integration.cy.js"
```

## Expected Behavior

### Successful Test Indicators:

-   ✅ Temperament switches from default 12-EDO to 31-EDO
-   ✅ Temperament Length block outputs correct cardinality (31, 5, etc.)
-   ✅ Define Mode accepts pitch numbers > 11 without errors
-   ✅ Pitch numbers wrap correctly using modulo arithmetic
-   ✅ Nth Modal Pitch works with custom temperament
-   ✅ Audio playback succeeds with microtonal intervals
-   ✅ No ReferenceError or undefined variable errors
-   ✅ Tone.js audio context initializes and runs

### What This Demonstrates:

1. **Microtonal Capability:** Shows Music Blocks can handle non-standard temperaments
2. **Dynamic Mode Definition:** Users can create modes with any pitch numbers
3. **Modulo Arithmetic:** System correctly wraps pitch numbers within temperament range
4. **Integration Safety:** All components work together without crashes
5. **Audio Synthesis:** Microtonal intervals produce actual sound

## Technical Verification

The test verifies that the temperament integration fixes work correctly:

-   **Null Guards:** `activity?.logo?.synth?.inTemperament` prevents crashes
-   **Global Safety:** `_` function always available during initialization
-   **Module Loading:** Global variable architecture maintained
-   **Array Safety:** Loops use correct array lengths
-   **Error Prevention:** Comprehensive error handling throughout

This test serves as both verification and documentation of the complete temperament integration feature set.
