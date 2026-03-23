# Block System Architecture

**Version:** 1.0  
**Date:** March 2026  
**Status:** Complete Reference Guide  
**Target Audience:** Contributors, Extension Developers, Maintainers

---

## Table of Contents

1. [Overview](#overview)
2. [Block Hierarchy & Class Structure](#block-hierarchy--class-structure)
3. [Block Lifecycle](#block-lifecycle)
4. [Block Types](#block-types)
5. [Block Docking System](#block-docking-system)
6. [Block Parameters & Setters](#block-parameters--setters)
7. [Palette System](#palette-system)
8. [Block Rendering & Artwork](#block-rendering--artwork)
9. [Block Execution Model](#block-execution-model)
10. [How to Add New Blocks](#how-to-add-new-blocks)
11. [Best Practices](#best-practices)
12. [Testing Blocks](#testing-blocks)

---

## Overview

The block system is the core visual programming interface of Music Blocks. Blocks represent:

- **Musical actions** (play note, set volume, etc.)
- **Control flow** (loops, conditionals, sequences)
- **Data operations** (variables, arithmetic, comparisons)
- **I/O operations** (mouse, sensors, camera)

### Key Design Principles

1. **Palette Organization** - Blocks grouped by category (Tone, Rhythm, etc.)
2. **Visual Docking** - Blocks connect in meaningful ways (constraint-based)
3. **Explicit Execution** - Block execution follows explicit flow (drag→ drop → run)
4. **Type System** - Blocks have formal types (flow, value, clamp, etc.)
5. **Dependency Injection** - External dependencies passed via Logo.deps

### Core Files

| File                 | Purpose                                       |
| -------------------- | --------------------------------------------- |
| `js/protoblocks.js`  | Block prototype definitions (56 dependencies) |
| `js/block.js`        | Core Block class with state management        |
| `js/blocks.js`       | Block manager and utilities                   |
| `js/basicblocks.js`  | Fundamental block definitions                 |
| `js/blockfactory.js` | Block artwork generation                      |
| `js/blocks/*.js`     | 20+ palette-specific block definitions        |
| `js/artwork.js`      | Palette colors, icons, visual attributes      |

---

## Block Hierarchy & Class Structure

### Class Hierarchy

```
Block (js/block.js)
├── Attributes
│   ├── name: string (unique identifier)
│   ├── dockTypes: string[] (allowed connections)
│   ├── palette: Palette (parent category)
│   └── artwork: SVG artifact
│
├── State Properties
│   ├── connections: Block[] (linked blocks)
│   ├── collapsed: boolean (UI state)
│   ├── highlight: boolean (visual feedback)
│   └── parameters: any[] (input values)
│
└── Methods
    ├── dock(block: Block): void
    ├── undock(): void
    ├── highlight(): void
    ├── unhighlight(): void
    └── getParameters(): any[]
```

### ProtoBlock (js/protoblocks.js)

ProtoBlocks are **templates** that define block behavior:

```javascript
const protoBlock = new ProtoBlock("blockName");

// Define dock types
protoBlock.setOutPorts(["out"]);
protoBlock.setInPorts(["in"]);

// Configure appearance
protoBlock.setShapeType("basic");
protoBlock.setColors(color1, color2, color3); // [base, dark, light]

// Define parameters
protoBlock.addNumberPort("value", 10);
protoBlock.addStringPort("label", "default");

// Set documentation
protoBlock.helpString = "Description of what block does";

// Register to palette
protoBlock.palette = palettes.dict["tonePalette"];
```

---

## Block Lifecycle

### Phase 1: Definition (Static)

```
ProtoBlock Definition
    ↓
Create Block Template (in basicblocks.js or palette-specific file)
    ↓
Register to Palette
```

### Phase 2: Creation (Dynamic)

```
User drags block from palette
    ↓
Block instance created
    ↓
Unique ID assigned
    ↓
Added to blocks.blockList
    ↓
Artwork (SVG) generated
```

### Phase 3: Configuration

```
User configures parameters
    ↓
Input values set
    ↓
Dock connections established
    ↓
Block state persisted
```

### Phase 4: Execution

```
User clicks "play"
    ↓
Logo interpreter reads blocks
    ↓
Block execution in order
    ↓
Parameters passed to execution context
    ↓
Associated action executed (play note, move turtle, etc.)
    ↓
Block execution completes
```

### Phase 5: Cleanup

```
Program stops
    ↓
Highlight/feedback removed
    ↓
Block state reset if needed
    ↓
Resources cleaned
```

---

## Block Types

### Flow Block (Has top and bottom dock)

```javascript
const flowBlock = new ProtoBlock("startHere");
flowBlock.setOutPorts(["out"]); // Bottom output
flowBlock.blockType = "startHere";
// Represents entry point to program execution
```

**Examples:** start here, play note, move

### Clamp Block (Wraps other blocks)

```javascript
const clampBlock = new ProtoBlock("repeat");
clampBlock.setOutPorts(["out"]);
clampBlock.setInPorts(["in"]);
clampBlock.clampBlock = ["flow"]; // Contains flow blocks
// Represents control flow structure
```

**Examples:** repeat, if-then, while loop

### Value Block (Returns a value)

```javascript
const valueBlock = new ProtoBlock("number");
valueBlock.dockTypes = ["numberout"];
// Can be used as input to other blocks
```

**Examples:** number, string, variable reference

### Argument Block (Takes parameters)

```javascript
const argBlock = new ProtoBlock("note");
argBlock.addNumberPort("pitch"); // Parameter
argBlock.dockTypes = ["noteout"];
```

---

## Block Docking System

### Dock Types (Connection Rules)

The docking system enforces **type-safe connections**:

| Dock Type    | Description                   | Example        |
| ------------ | ----------------------------- | -------------- |
| `out`        | Flow output (bottom of block) | Start Here     |
| `in`         | Flow input (top of block)     | Any flow block |
| `numberout`  | Numeric return value          | Number block   |
| `numberin`   | Accepts numeric input         | Multiply       |
| `booleanout` | Boolean return value          | Compare block  |
| `booleanin`  | Accepts boolean input         | If-then        |
| `noteout`    | Pitch/note value              | Pitch block    |
| `notein`     | Accepts note input            | Play note      |
| `stringout`  | String return value           | Text block     |
| `stringin`   | Accepts string input          | Label          |

### Docking in Code

```javascript
// Register in protoblocks.js
const multiplyBlock = new ProtoBlock("multiply");
multiplyBlock.addNumberPort("a", 10); // Accepts numberout inputs
multiplyBlock.addNumberPort("b", 5);
multiplyBlock.dockTypes = ["numberout"]; // Returns number

// Runtime docking check
if (sourceBlock.dockTypes.includes("numberout") && targetBlock.dockTypes.includes("numberin")) {
    sourceBlock.dock(targetBlock);
}
```

### Allowed Connections

Defined in `js/blocks.js` as `ALLOWED_CONNECTIONS`:

```javascript
const ALLOWED_CONNECTIONS = {
    out: ["in"],
    in: ["out"],
    numberout: ["numberin", "booleanin"],
    numberin: ["numberout", "booleanout"]
    // ... etc
};
```

---

## Block Parameters & Setters

### Parameter Types

**Value Parameters** (Static)

```javascript
// Number parameter
protoBlock.addNumberPort("pitch", 60); // default: C4

// String parameter
protoBlock.addStringPort("text", "hello");

// Dropdown parameter
protoBlock.addArgsPort(["option1", "option2"]);
```

**Block Inputs** (Dynamic - accept blocks)

```javascript
// Clamp block can contain other blocks
protoBlock.clampBlock = ["flow"]; // Holds sequence of blocks

// Parameter can be another block's output
protoBlock.addNumberPort("value"); // Can be connected to numberout block
```

### Setters Pattern

During execution, values are set via setter pattern:

```javascript
// In turtle actions
if (this.logo.deps?.Singer) {
    this.logo.deps.Singer.setSynthVolume(
        this.logo,
        0,
        voice,
        value // This comes from block parameter
    );
}
```

---

## Palette System

### Palette Definition

**In `js/artwork.js`:**

```javascript
const COLORS = {
    tone: {
        primary: "#FF6666",
        secondary: "#CC5555",
        tertiary: "#EE8888"
    },
    rhythm: {
        primary: "#FFBB44",
        secondary: "#CC9933",
        tertiary: "#FFDD88"
    }
    // ... more palettes
};
```

### Palette Registration

```javascript
// In basic or palette-specific blocks file
const tonePalette = new Palette("tone");
tonePalette.color = COLORS.tone;
tonePalette.icon = "tone.svg";

// Add blocks to palette
const noteBlock = new ProtoBlock("note");
noteBlock.palette = tonePalette; // Register to palette
palettes.dict["tone"] = tonePalette;
```

### Palette Files in `js/blocks/`

| File                 | Palette   | Blocks                        |
| -------------------- | --------- | ----------------------------- |
| `ToneBlocks.js`      | Tone      | play note, rest, sharps/flats |
| `RhythmBlocks.js`    | Rhythm    | note value, rhythm patterns   |
| `IntervalsBlocks.js` | Intervals | intervals, scale degrees      |
| `PitchBlocks.js`     | Pitch     | pitch conversion, analysis    |
| `DrumBlocks.js`      | Drum      | drum sounds, percussion       |
| `VolumeBlocks.js`    | Volume    | volume, loudness              |
| `OrnamentBlocks.js`  | Ornament  | ties, slides, vibratos        |
| `TurtleBlocks.js`    | Turtle    | movement, rotation            |
| `GraphicsBlocks.js`  | Graphics  | drawing, shapes               |
| `HeapBlocks.js`      | Heap      | push, pop, array ops          |
| `DictBlocks.js`      | Dict      | dictionary operations         |
| `MeterBlocks.js`     | Meter     | time signatures, tempo        |
| `WidgetBlocks.js`    | Widget    | reflection, frequency, stats  |

---

## Block Rendering & Artwork

### Block SVG Generation

**In `js/blockfactory.js`:**

```javascript
class BlockFactory {
    // Generate SVG artwork for a block
    generateBlock(protoBlock) {
        // Calculate dimensions based on parameters
        const height = 30;
        const width = this.calculateWidth(protoBlock);

        // Create SVG path for block shape
        const path = this.generatePath(width, height, protoBlock.dockTypes);

        // Apply colors from palette
        const fill = protoBlock.palette.color.primary;
        const stroke = protoBlock.palette.color.secondary;

        // Add text label
        const text = this.createLabel(protoBlock.name);

        // Return complete SVG group
        return this.createSVGGroup(path, text, fill, stroke);
    }

    // Add parameter input visuals
    addParameterVisuals(svg, parameters) {
        parameters.forEach(param => {
            // Add input circle/slot for parameter
            // Add text label for parameter
        });
    }
}
```

### Block Shapes

| Shape    | Used For           | Example    |
| -------- | ------------------ | ---------- |
| Basic    | Rectangular flow   | play note  |
| Clamp    | Wrapping container | repeat     |
| Value    | Oval output        | number     |
| Boolean  | Diamond            | comparison |
| Argument | Rounded rectangle  | text input |

### Visual Attributes

```javascript
// Colors
block.primaryColor = "#FF6666"; // Main fill
block.secondaryColor = "#CC5555"; // Border/shadow
block.tertiaryColor = "#EE8888"; // Highlight

// Typography
block.label = "Note"; // Block name
block.parameters = [60, 4]; // Parameter display

// States
block.highlight = true | false; // Visual feedback
block.collapsed = true | false; // Minimize indicator
block.error = true | false; // Error state
```

---

## Block Execution Model

### Execution Flow

```
Logo.run() called
    ↓
Find "start here" block
    ↓
Execute block sequence:
    1. Read block parameters/inputs
    2. Get connected blocks
    3. Extract values from value blocks
    4. Execute block action (via turtleactions)
    5. Get next block (following dock connections)
    ↓
Continue until:
    - No next block (program end)
    - Stop called
    - Error occurs
```

### Execution Context

Passed through execution chain:

```javascript
// Context object passed to block executors
const context = {
    turtle: Turtle, // Current turtle
    logo: Logo, // Logo engine
    activity: Activity, // Parent activity
    turIndex: 0, // Turtle index
    blockCount: 1 // Block counter
};
```

### Block Action Execution

In `js/turtleactions/` files:

```javascript
// Pattern for executing block action
class ToneActions {
    playNote(logo, turtle, duration, pitch) {
        // 1. Validate inputs
        if (!pitch || !duration) return;

        // 2. Use deps for safe access
        if (logo.deps?.Singer) {
            logo.deps.Singer.playNote(pitch, duration, turtle);
        }

        // 3. Update state
        turtle.lastNote = pitch;
    }
}
```

---

## How to Add New Blocks

### Step 1: Define the ProtoBlock

**File:** `js/basicblocks.js` or `js/blocks/MyPaletteBlocks.js`

```javascript
const setupMyBlock = function (palettes, blocks, logo) {
    const protoBlock = new ProtoBlock("myblock");

    // Set palette
    protoBlock.palette = palettes.dict["mypalette"];

    // Define dock types
    protoBlock.setOutPorts(["out"]); // Can connect to other blocks
    protoBlock.setInPorts(["in"]); // Can receive other blocks

    // Add parameters
    protoBlock.addNumberPort("value", 10); // Number input
    protoBlock.addArgsPort(["option1", "opt2"]); // Dropdown

    // Set appearance
    protoBlock.setColors(
        "#FF6666", // Primary color
        "#CC5555", // Secondary
        "#EE8888" // Tertiary
    );

    // Documentation
    protoBlock.helpString = "Does something useful";

    // Set description
    protoBlock.staticLabels = ["my block"];

    // Return block definition
    return protoBlock;
};
```

### Step 2: Register to Logo

**File:** `js/logo.js` (in Logo constructor or setup method)

```javascript
// Call setup function
setupMyBlock(palettes, blocks, logo);

// Register execution handler
blocks.setBlockAction("myblock", (logo, turtle, blockNumber) => {
    // Get block parameters
    const value = blocks.blockList[blockNumber].value[0];

    // Execute action using deps
    if (logo.deps?.MyDependency) {
        logo.deps.MyDependency.someAction(value);
    }
});
```

### Step 3: Implement Block Action

**File:** `js/turtleactions/MyTurtleActions.js`

```javascript
class MyActions {
    myBlockAction(logo, turtle, value) {
        // Validate inputs
        if (typeof value !== "number") {
            console.error("Value must be a number");
            return;
        }

        // Execute action
        // ... implementation ...

        // Update state
        // ... state update ...
    }
}
```

### Step 4: Write Tests

**File:** `js/blocks/__tests__/MyBlock.test.js`

```javascript
describe("MyBlock", () => {
    let logo, blocks, turtle;

    beforeEach(() => {
        // Setup mocks
        logo = createMockLogo();
        blocks = createMockBlocks();
        turtle = createMockTurtle();
    });

    it("should execute myblock action", () => {
        const block = blocks.blockList[0];
        const action = blocks.getBlockAction("myblock");

        action(logo, turtle, 0);

        expect(someCondition).toBe(true);
    });

    it("should handle parameter validation", () => {
        // Test with invalid parameters
    });
});
```

---

## Best Practices

### 1. **Always Use Dependency Injection**

❌ **Bad:**

```javascript
Singer.setSynthVolume(volume); // Direct global access
```

✅ **Good:**

```javascript
if (this.logo.deps?.Singer) {
    this.logo.deps.Singer.setSynthVolume(volume);
}
```

### 2. **Validate Inputs**

```javascript
if (typeof value !== "number" || value < 0) {
    logo.errorMsg("Value must be a positive number");
    return;
}
```

### 3. **Document Block Purpose**

```javascript
protoBlock.helpString =
    "Sets the volume of the synth. " + "Value ranges from 0 (silent) to 1 (full volume).";
```

### 4. **Use Consistent Naming**

- Block names: `lowercaseWithoutSpaces`
- Palette names: `lowercase`
- Parameter labels: `Human Readable`

### 5. **Test Edge Cases**

```javascript
describe("Block edge cases", () => {
    it("handles null inputs", () => {
        /* ... */
    });
    it("handles boundary values", () => {
        /* ... */
    });
    it("handles type mismatches", () => {
        /* ... */
    });
});
```

### 6. **Follow Execution Patterns**

All blocks follow this pattern:

1. Get parameters from block definition
2. Validate inputs
3. Use deps for safe access to services
4. Execute action
5. Update state/UI

---

## Testing Blocks

### Unit Testing

```javascript
describe("ToneBlocks", () => {
    let mockLogo, mockTurtle;

    beforeEach(() => {
        mockLogo = {
            deps: {
                Singer: { setSynthVolume: jest.fn() }
            }
        };
        mockTurtle = { lastNote: null };
    });

    test("playNote calls Singer.setSynthVolume", () => {
        const action = new ToneActions();
        action.playNote(mockLogo, mockTurtle, 60, 4);

        expect(mockLogo.deps.Singer.setSynthVolume).toHaveBeenCalledWith(
            expect.any(Object),
            0,
            "default",
            expect.any(Number)
        );
    });
});
```

### Integration Testing

```javascript
// Test block execution in context
test("block execution chain", () => {
    const blocks = setupTestBlocks();
    const startBlock = blocks[0];

    logo.run(startBlock);

    expect(executionResult).toMatch(expectedOutput);
});
```

### Visual Testing

Test block rendering:

- Parameter input visibility
- Color application
- Size calculation
- Dock point positions

---

## Dependency Chain

### Critical Dependencies

The block system depends on:

| Module              | Usage                               |
| ------------------- | ----------------------------------- |
| `Logo` (via `deps`) | Execution context, state management |
| `Turtle/Turtles`    | Graphics execution, state           |
| `Singer`            | Audio/note execution                |
| `Synth`             | Synthesizer control                 |
| `Blocks`            | Block management, coordination      |
| `LogoDependencies`  | Safe dependency access (NEW)        |

### How Dependencies Are Injected

```javascript
// In activity initialization
const deps = new LogoDependencies({
    blocks: this.blocks,
    turtles: this.turtles,
    stage: this.stage
    // ... other deps
});

const logo = new Logo(deps);
```

---

## Troubleshooting

### Block Not Appearing

1. Check palette registration: `protoBlock.palette = palettes.dict['name']`
2. Verify block setup called in Logo initialization
3. Check browser console for errors

### Block Not Executing

1. Verify block action registered: `blocks.setBlockAction('name', actionFunc)`
2. Check block parameters passing correctly
3. Verify dependencies available in `logo.deps`

### Parameter Not Showing

1. Check parameter defined in protoBlock: `protoBlock.addNumberPort(...)`
2. Verify artwork generation includes parameter visuals
3. Check BlockFactory renders parameter slots

### Execution Order Wrong

1. Verify dock connections correct
2. Check block flow through execution engine
3. Debug Logo.run() execution trace

---

## Files Reference

| File                 | Lines  | Purpose                             |
| -------------------- | ------ | ----------------------------------- |
| `js/protoblocks.js`  | 1000+  | Block template definitions          |
| `js/block.js`        | 500+   | Block state and methods             |
| `js/blocks.js`       | 2000+  | Block manager, utilities            |
| `js/blockfactory.js` | 800+   | SVG artwork generation              |
| `js/basicblocks.js`  | 1000+  | Core block definitions              |
| `js/artwork.js`      | 500+   | Colors, icons, palette definitions  |
| `js/blocks/`         | 15000+ | Palette-specific blocks (20+ files) |
| `js/turtleactions/`  | 8000+  | Block action implementations        |

---

## Resources

- **Contributing Guide:** See CONTRIBUTING.md
- **Testing Guide:** See Docs/TESTING.md
- **Architecture Guide:** See DOCS_MODULE_ARCHITECTURE.md
- **Adding Blocks Guide:** See js/README.md

---

**Last Updated:** March 2026  
**Maintainer:** Music Blocks Core Team  
**Status:** Complete and Current
