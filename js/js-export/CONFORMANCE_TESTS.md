# Round-Trip Conformance Testing Suite for Music Blocks ↔ JavaScript Conversion

This document describes the round-trip conformance test harness for Music Blocks. The test suite verifies bi-directional translation fidelity between Music Blocks visual representations (`blockList`) and generated JavaScript code, ensuring semantic preservation, preventing structural drift, and validating conversion stability.

## Table of Contents

1. [Harness Overview](#harness-overview)
2. [Conversion Pipelines](#conversion-pipelines)
    - [Round-Trip Conformance Pipeline](#round-trip-conformance-pipeline)
    - [Second-Export Stability Pipeline](#second-export-stability-pipeline)
3. [Architecture & Files](#architecture--files)
4. [Semantic Normalization Engine](#semantic-normalization-engine)
    - [Layout vs. Semantic Structure](#layout-vs-semantic-structure)
    - [Canonical Equivalences](#canonical-equivalences)
5. [Corpus Coverage](#corpus-coverage)
6. [Failure Diagnostics](#failure-diagnostics)
7. [Adding New Regression Tests](#adding-new-regression-tests)
8. [Scope & Non-Guarantees](#scope--non-guarantees)

---

## Harness Overview

Music Blocks supports two-way editing between graphical block stacks and executable JavaScript source code:

- **Export**: Visual blocks are serialized to JavaScript using `JSGenerate` (`generate.js`, `ASTutils.js`).
- **Import**: JavaScript code is parsed with Acorn and reconstructed into visual block stacks using `AST2BlockList` (`ast2blocklist.js`, `ast2blocks.json`).

The conformance test harness provides automated verification for both directions:

- Executes the production exporter (`JSGenerate`) and importer (`AST2BlockList`) directly.
- Normalizes block representations to compare semantic structure rather than transient canvas coordinates.
- Validates that conversion reaches a stable fixed point across successive exports.

---

## Conversion Pipelines

### Round-Trip Conformance Pipeline

The primary conformance pipeline validates that converting blocks to JavaScript and back preserves program semantics:

```text
Original Blocks (blockList)
        │
        ▼ (JSGenerate / ASTutils)
Generated JavaScript (code)
        │
        ▼ (Acorn + AST2BlockList)
Recovered Blocks (blockList)
        │
        ├─────────────────────────────┐
        ▼                             ▼
normalizeBlockStructure()     normalizeBlockStructure()
        │                             │
        └──────────────┬──────────────┘
                       ▼
          Structural Deep Equality (Jest)
```

### Second-Export Stability Pipeline

The stability pipeline verifies that exporting the recovered blocks produces code with an identical Abstract Syntax Tree:

```text
Original Blocks
        │
        ▼
Generated JavaScript (code1)
        │
        ▼
Recovered Blocks
        │
        ▼
Second JavaScript Export (code2)
        │
        ├─────────────────────────────┐
        ▼                             ▼
  stripAstLocations()           stripAstLocations()
        │                             │
        └──────────────┬──────────────┘
                       ▼
            AST Identity (ast1 == ast2)
```

If `AST(code1) === AST(code2)`, the conversion does not produce compounding syntactic drift upon repeated editing.

---

## Architecture & Files

The conformance suite is located under `js/js-export/__tests__/`:

| File                            | Purpose                                                                                                                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `conformance-harness.js`        | Test harness: environment setup, protoblock metadata resolution, Activity mocking, execution of `JSGenerate` and `AST2BlockList`, second-export verification, and diagnostic formatting. |
| `conformance-normalize.js`      | Canonical normalizer: separates semantic logic from visual positioning, resolves statement sequences, normalizes clamps, and reconciles beginner/advanced representations.               |
| `conformance-corpus.js`         | Deterministic test corpus containing 59 representative block programs across arithmetic, variables, actions, control flow, pitch expressions, and switch blocks.                         |
| `roundtrip-conformance.test.js` | Jest test suite executing all corpus cases through both the round-trip conformance and second-export stability pipelines.                                                                |

---

## Semantic Normalization Engine

### Layout vs. Semantic Structure

Visual block representations in Music Blocks store both semantic information and canvas layout state:

```json
[blockId, blockNameOrInfo, canvasX, canvasY, [connectionSlots...]]
```

When comparing original and recovered programs, the normalizer separates layout artifacts from language semantics:

- **Ignored (Layout Artifacts)**:
    - Block numeric IDs (reallocated during import).
    - Canvas X and Y coordinates (layout placement).
    - Visual spacer blocks (`vspace`, `hspace`, `hidden`).
    - Internal UI flags (`trash`, `protoblock` rendering references).
- **Preserved (Semantic Structure)**:
    - Block command and operator names.
    - Constant values and data types (numbers, text strings, booleans, note names).
    - Argument expressions and nested argument trees.
    - Statement execution order.
    - Clamp nesting and statement bodies (loops, conditionals, action definitions).
    - Branch selections (then vs. else clauses).

### Canonical Equivalences

The normalizer accounts for alternate block representations that map to identical JavaScript constructs:

1. **Beginner vs. Advanced Blocks**:
    - `do` (beginner block with action name text slot) maps to `await actionName(mouse)`. When imported, it maps to `nameddo`. The normalizer canonicalizes `do` to `nameddo`.
    - `storein` (beginner box assignment with variable name text slot) maps to `boxName = value`. When imported, it maps to `storein2`. The normalizer canonicalizes `storein` to `storein2`.
2. **Clamp Child Statement Sequences**:
    - Single-statement and multi-statement clamp bodies are normalized into uniform statement arrays.
3. **Numeric Literal Representation**:
    - Numeric values passed as strings (e.g. `["number", { value: "100" }]`) vs. numbers (`["number", { value: 100 }]`) are normalized to standard numbers.
    - Negative numbers exported as JavaScript unary expressions (`-15`) and imported as `neg(number(15))` are folded into `{ name: "number", value: -val }`.
4. **Text and String Literals**:
    - Text/string literal blocks are normalized while retaining their original block name and literal value.

---

## Corpus Coverage

The test corpus in `conformance-corpus.js` contains 59 deterministic programs across 6 categories:

1. **Basic Literals and Expressions (`basicValuesAndExpressions`, 15 cases)**:
    - Numeric literals: positive integer (42), negative integer (-15), floating point decimal (3.14).
    - Text literal: string literal ("Hello Music Blocks").
    - Binary arithmetic: `plus`, `minus`, `multiply`, `divide`, `mod`.
    - Compound arithmetic: nested expression `(5 + 3) * (10 - 2)`.
    - Comparisons: `equal`, `greater`.
    - Logical operations: `and`, `or`, `not`.
    - Boolean literals: `true`, `false`.
2. **Variables and Boxes (`variablesAndBoxes`, 10 cases)**:
    - Variable assignment: `storein2` with integer literal, string literal, and arithmetic product.
    - Beginner variable assignment: `storein` with text slot.
    - Variable retrieval: `namedbox` references.
    - Variable operations: addition with literal (`base + 25`), multiplication of two distinct boxes (`a * b`).
    - Sequential reassignment: self-updating variable (`counter = counter + 1`).
    - Multiple distinct boxes: summing three boxes (`x + y + z`).
    - Parameter passing: box passed to command block (`forward stepSize`).
    - Comparison evaluation: box evaluated in comparison (`score > 50`).
3. **Actions and Calls (`actionsAndCalls`, 7 cases)**:
    - Definition and invocation: `action` defined and called via `nameddo`.
    - Beginner invocation: `action` called via beginner `do` block with text slot.
    - Multi-statement bodies: action containing sequential commands (`forward`, `right`).
    - Subroutine nesting: action calling another defined action.
    - Multiple independent actions: sequential definitions called in order from `start`.
    - Parameterized invocation: action called with arguments via `nameddoArg`.
    - Local variable scoping: action containing local box assignment (`storein2`) and print statements.
4. **Control Flow and Repetition (`controlFlow`, 10 cases)**:
    - Repetition: `repeat` with fixed count, dynamic box count, and nested `repeat` loops.
    - Infinite loops: `forever` loop clamp.
    - Conditionals: single-branch `if`, double-branch `ifthenelse`, and `ifthenelse` nested inside `repeat`.
    - Conditional loops: `while` loop, `until` loop.
    - Loop termination: `repeat` loop with `break`.
5. **Pitch and Pitch Expressions (`pitchAndPitches`, 11 cases)**:
    - Standard pitch: `pitch` with note name (`"C"`) and octave number (4).
    - Solfege naming: `pitch` with solfege syllable (`"sol"`) and octave number (4).
    - Microtonal pitch prefixes: sharp prefix (`"^C"`), flat prefix (`"vvD♭"`), microtonal solfege (`"^sol"`).
    - Accidental spellings: explicit sharp spelling (`"E♯"`), double sharp accidental (`"C𝄪"`).
    - Dynamic and computed pitch: pitch from a box variable reference (`namedbox`), pitch computed from an arithmetic expression (`base + 1`).
    - Numeric pitch: pitch specified as numeric value (`5`, verifying #8983 regression).
    - Note duration clamps: `pitch` inside `newnote` duration clamp.
6. **Switch and Branch Selection (`switchCases`, 6 cases)**:
    - Single case: `switch` with one numeric `case` and a `defaultcase`.
    - Multiple cases: `switch` with two numeric `case` branches and a `defaultcase`.
    - Variable discriminant: `switch` controlled by a `namedbox` variable.
    - String literals: `switch` matching string literal `case` branches (`"A"`) with `defaultcase`.
    - Nested switch: `switch` nested inside a `repeat` loop clamp.
    - Arithmetic discriminant: `switch` with compound expression (`1 + 1`) as discriminant.

---

## Failure Diagnostics

When a round-trip or stability check fails, `formatConformanceDiagnostics` generates a structured failure report:

```text
=================== CONFORMANCE FAILURE DIAGNOSTIC ===================
Case: pitch_numeric_pitch_number
Stage: NORMALIZED_DIFF
--- Error ---
Structural mismatch: node at path [1].args[0] differs
--- Diff / Discrepancy ---
{
  "expected": { "name": "number", "value": 5 },
  "actual": { "name": "notename", "value": "5" }
}
--- Generated JavaScript (Export 1) ---
new Mouse(async mouse => {
    await mouse.playPitch(5, 4);
    return mouse.ENDMOUSE;
});
MusicBlocks.run();
--- Original Blocks ---
[...]
--- Recovered Blocks ---
[...]
======================================================================
```

The diagnostic details the exact stage (first export, import, normalization diff, second export, or AST mismatch), providing the relevant blocks, generated code, and structural discrepancies.

---

## Adding New Regression Tests

When adding a test case for a bug fix or new block mapping:

1. **Add Entry to `conformance-corpus.js`**:
   Add a test case to the appropriate category array:
    ```javascript
    {
        name: "my_new_case",
        description: "Verifies conversion of block X (Related to #1234)",
        category: "my_category",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "forward", 0, 0, [0, 2, null]],
            [2, ["number", { value: 100 }], 0, 0, [1]]
        ]
    }
    ```
2. **Register Protoblock Metadata (if adding a new block type)**:
   Ensure `resolveProtoBlock` in `conformance-harness.js` returns the correct style (`command`, `arg`, `clamp`, `value`) and argument count.
3. **Run the Test Suite**:
    ```bash
    npx jest js/js-export/__tests__/roundtrip-conformance.test.js
    ```
4. **Verify Conformance and Stability**:
   Ensure both normalized structural equality and second-export AST stability tests pass for the new case.

---

## Scope & Non-Guarantees

- **Canvas Layout Coordinates**: The suite verifies semantic and AST equivalence, not canvas `(x, y)` coordinate preservation. Visual positions and non-executable spacer blocks (`vspace`, `hspace`) are regenerated by the layout engine.
- **Unmapped Blocks**: Commands requiring runtime sample loading (such as specific percussion and drum sample banks) are excluded until headless audio mocking is expanded.
- **Arbitrary JavaScript**: The importer parses JavaScript that targets the Music Blocks runtime API (`new Mouse(async mouse => { ... })`). General-purpose JavaScript code without Music Blocks API methods is outside conversion scope.
- **Code Comments**: JavaScript comments are not preserved across the block graph representation.
