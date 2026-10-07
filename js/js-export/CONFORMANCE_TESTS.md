# Round-Trip Conformance Testing Suite for Music Blocks ↔ JavaScript Conversion

This document describes the round-trip conformance test harness for Music Blocks. The test suite verifies bi-directional translation fidelity between Music Blocks visual representations (`blockList`) and generated JavaScript code, ensuring semantic preservation, preventing structural drift, and enforcing fixed-point stability.

## Table of Contents

1. [Overview & Motivation](#overview--motivation)
2. [Conversion Pipelines](#conversion-pipelines)
    - [Round-Trip Conformance Pipeline](#round-trip-conformance-pipeline)
    - [Second-Export Stability Pipeline](#second-export-stability-pipeline)
3. [Architecture & Components](#architecture--components)
4. [Semantic Normalization Engine](#semantic-normalization-engine)
    - [Visual Layout vs. Semantic Structure](#visual-layout-vs-semantic-structure)
    - [Canonical Equivalences](#canonical-equivalences)
5. [Test Corpus Coverage](#test-corpus-coverage)
6. [Failure Diagnostics](#failure-diagnostics)
7. [Adding New Regression Test Cases](#adding-new-regression-test-cases)
8. [Known Scope & Future Extensions](#known-scope--future-extensions)

---

## Overview & Motivation

Music Blocks supports two-way editing between graphical block stacks and executable JavaScript source code:

- **Export**: Visual blocks are serialized to JavaScript using `JSGenerate` (`generate.js`, `ASTutils.js`).
- **Import**: JavaScript code is parsed with Acorn and reconstructed into visual block stacks using `AST2BlockList` (`ast2blocklist.js`, `ast2blocks.json`).

Historically, changes to the exporter or importer could introduce subtle structural drift—such as altered argument wrapping, mismatched flow connections, lost clamp nesting, or broken variable scopes—without failing surface-level syntax checks.

The conformance test harness provides a deterministic verification system that:

- Executes the **real production exporter and importer** without mock pipelines.
- Normalizes block representations to compare underlying AST/semantic structures rather than transient UI coordinates.
- Validates that conversion reaches a **mathematical fixed point** (idempotence).

---

## Conversion Pipelines

### Round-Trip Conformance Pipeline

The primary conformance pipeline validates that converting blocks to JavaScript and back produces an equivalent program:

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

The stability pipeline verifies that once blocks are converted to JavaScript and recovered, a second export produces code with an identical Abstract Syntax Tree:

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

If `AST(code1) === AST(code2)`, the conversion is proven to be **stable** and free of recursive expansion or compounding mutations.

---

## Architecture & Components

The conformance suite is located under `js/js-export/__tests__/`:

| File                            | Purpose                                                                                                                                                                                         |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `conformance-harness.js`        | Test runner harness: environment setup, protoblock metadata resolution, Activity mocking, execution of `JSGenerate` and `AST2BlockList`, second-export verification, and diagnostic formatting. |
| `conformance-normalize.js`      | Canonical normalizer: separates semantic logic from visual positioning, resolves statement sequences, normalizes clamps, and reconciles beginner/advanced representations.                      |
| `conformance-corpus.js`         | Deterministic test corpus containing categorized representative block programs across arithmetic, variables, actions, control flow, pitch expressions, and switch blocks.                       |
| `roundtrip-conformance.test.js` | Jest test suite executing all corpus cases through both the round-trip conformance and second-export stability pipelines.                                                                       |

---

## Semantic Normalization Engine

### Visual Layout vs. Semantic Structure

Visual block representations in Music Blocks contain both semantic information and canvas layout state:

```json
[blockId, blockNameOrInfo, canvasX, canvasY, [connectionSlots...]]
```

When comparing original and recovered programs, the normalizer strictly decouples layout artifacts from language semantics:

- **Ignored / Discarded (Layout Artifacts)**:
    - Block numeric IDs (reallocated during import).
    - Canvas X and Y coordinates (layout placement).
    - Internal UI flags (`trash`, `protoblock` rendering references).
    - Absolute slot index references in connections.
- **Preserved & Compared Strictly (Semantic Structure)**:
    - Block operator/command names.
    - Constant values and data types (numbers, strings, booleans).
    - Argument expressions and nested argument trees.
    - Execution sequence (statement flow order).
    - Clamp nesting and nested child flow statements (bodies of loops, branches, action definitions).
    - Branch selections (consequent vs. alternate clauses).

### Canonical Equivalences

In some cases, Music Blocks offers alternate block representations that export to the same canonical JavaScript form:

1. **Beginner vs. Advanced Blocks**:
    - `do` (beginner block with action name slot) exports to `await actionName(mouse)`. When imported, it maps to `nameddo`. The normalizer canonicalizes `do` to `nameddo`.
    - `storein` (beginner box assignment with name slot) exports to `boxName = value`. When imported, it maps to `storein2`. The normalizer canonicalizes `storein` to `storein2`.
2. **Clamp Child Statement Sequences**:
    - Single-statement clamp bodies and multi-statement clamp bodies are normalized into uniform statement arrays.
3. **Numeric Literal Representation**:
    - Numeric values passed as strings (e.g. `["number", { value: "100" }]`) vs. numbers (`["number", { value: 100 }]`) are normalized to standard numbers.
    - Negative numbers exported as JavaScript unary expressions (`-15`) are imported as `neg(number(15))`. The normalizer folds unary negations on numeric constants into `{ name: "number", value: -val }`.
4. **String and Text Identifiers**:
    - `text` and `string` blocks carrying literal text values are normalized into canonical `{ name: "text", value: "..." }` nodes.

---

## Test Corpus Coverage

The test corpus in `conformance-corpus.js` contains 59 deterministic programs organized across 6 core functional areas:

1. **Basic Literals and Arithmetic Expressions (`basicValuesAndExpressions`)**:
    - Numeric literals, negative numbers, decimal values.
    - Binary arithmetic: `plus`, `minus`, `multiply`, `divide`, `mod`.
    - Compound nested expressions: `(1 + 2) * (3 - 4)`.
    - Unary operators: `sqrt`, `abs`, `round`, `int`, `sin`, `cos`.
    - Comparisons and logic: `equal`, `not_equal_to`, `less`, `greater`, `and`, `or`, `not`, `xor`.
    - Booleans: `true` and `false`.
2. **Variables and Boxes (`variablesAndBoxes`)**:
    - Assignment: `storein2`, beginner `storein`.
    - Variable retrieval: `namedbox`, `box`.
    - Variable self-updates: `box1 = box1 + 1`.
    - Multiple independent boxes: `box1`, `box2`.
    - Sequential re-assignments.
3. **Actions, Arguments, and Calls (`actionsAndCalls`)**:
    - Subroutine definitions (`action`).
    - Action invocations: `nameddo` (parameterless) and `nameddoArg` (with arguments).
    - Beginner `do` action invocation.
    - Action arguments: `namedarg` within action bodies.
    - Multiple defined actions and call order.
4. **Control Flow and Repetition (`controlFlow`)**:
    - Loops: `repeat` with numeric and box limits, `forever`, `while`, `until`.
    - Conditionals: `if` single-branch, `ifthenelse` two-branch.
    - Nested loops and compound conditionals.
    - Loop interruption: `break` inside while/forever loops.
5. **Pitch and Pitch Expressions (`pitchAndPitches`)**:
    - Note playback: `pitch` with notename (`"do"`, `"A"`, `"C#"`) and octave number.
    - Variable pitch expressions: pitch with box octave, arithmetic note computation (`base + 1`).
    - Transposition: `pitch` within transposition clamps.
    - Numeric pitch values (#8983 regression).
    - Duration clamps: `pitch` within `newnote` clamps.
6. **Switch and Branch Selection (`switchCases`)**:
    - Single-case switch with `defaultcase`.
    - Multi-case switch with default branch.
    - Switch without default branch.
    - Empty case clauses.
    - Sequential fall-through cases (`case 1`, `case 2` sharing body).
    - Switch statements with compound discriminant expressions (e.g. `1 + 1`).

---

## Failure Diagnostics

When a round-trip or stability check fails, `formatConformanceDiagnostics` generates an actionable failure report:

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

This diagnostic pinpoints the exact failure stage (first export, import, normalization diff, second export, or AST mismatch) to accelerate root-cause analysis.

---

## Adding New Regression Test Cases

When fixing a conversion issue or adding support for a new block:

1. **Open `conformance-corpus.js`**:
   Add an entry to the appropriate category array or create a new category:
    ```javascript
    {
        name: "my_new_regression_case",
        description: "Verifies conversion of block X with Y (Related to #1234)",
        category: "my_category",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "my_block", 0, 0, [0, 2, null]],
            [2, ["number", { value: 100 }], 0, 0, [1]]
        ]
    }
    ```
2. **Ensure Protoblock Metadata is Registered**:
   If `my_block` is a new block type, ensure `resolveProtoBlock` in `conformance-harness.js` returns its correct style (`command`, `arg`, `clamp`, `value`) and argument count.
3. **Run the Test Suite**:
    ```bash
    npx jest js/js-export/__tests__/roundtrip-conformance.test.js
    ```
4. **Verify Stability**:
   Ensure both the normalized structural equality and the second-export AST stability tests pass for the new case.

---

## Known Scope & Future Extensions

- **Sound Samples & Drums**: Drum commands (e.g. `snaredrum`) require specific audio-bank mappings that depend on runtime sample loading; these can be added once headless audio mocking is expanded.
- **Graphics Primitives**: Turtle drawing commands (`forward`, `back`, `right`, `left`, `setcolor`) are supported in statements; additional complex canvas transforms can be added as dedicated corpus sets.
- **Macro Expansions**: Built-in macros expand during export; tests for macros should compare the expanded structural form against imported results.
