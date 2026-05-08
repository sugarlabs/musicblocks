# CreateJS Migration Audit

## Goal

Audit all CreateJS usages in Music Blocks and define a low-risk phased migration strategy for replacing the abandoned CreateJS rendering stack with a maintained alternative.

---

# Core CreateJS APIs

## createjs.Stage

### Files
- js/activity.js

### Purpose
- Main canvas rendering root
- Central display hierarchy manager
- Rendering lifecycle orchestration

### Observations
- Stage initialized using:
  `this.stage = new createjs.Stage(this.canvas)`
- Stage stored on the activity instance as `this.stage`
- Touch support enabled via `createjs.Touch.enable(this.stage)`
- Rendering updates are tied to a custom render loop started through `_startRenderLoop()`
- Canvas refreshes are invalidation-based through `refreshCanvas()`
- Rendering updates are triggered by setting:
  `stageDirty = true`
  `update = true`
- Rendering appears centrally orchestrated rather than directly calling `stage.update()` throughout the codebase
- Existing invalidation-based rendering architecture may simplify renderer abstraction and incremental migration

### Migration Risk
- High

---

## createjs.Container

### Files
- js/turtle.js
- js/turtles.js
- js/block.js
- js/trash.js
- js/boundary.js
- js/activity.js

### Purpose
- Grouping display objects
- Shared transforms for sprites and UI elements
- Scene graph organization
- Drag/drop composition

### Observations
- Turtle subsystem uses nested container hierarchy
- Rendering is organized into subtree containers attached to the global stage
- Example flow:
  `activity.stage -> turtleContainer -> borderContainer`
- Subsystem isolation may allow incremental migration without rewriting the entire rendering layer
- Containers are heavily used for grouped transforms and scene organization
- Container composition patterns map relatively well to Konva Group abstractions
- Multiple rendering subsystems already appear modularized around container ownership boundaries, which may support phased subsystem-by-subsystem migration.

### Migration Risk
- Medium

---

## createjs.Bitmap

### Files
- js/block.js
- js/turtle.js
- js/turtles.js
- js/boundary.js

### Purpose
- Render SVG-generated block graphics
- Render turtle sprites and decorations
- Display image assets inside container hierarchy

### Observations
- Block graphics are generated asynchronously from SVG data
- SVGs are converted into base64 image sources before bitmap creation
- Bitmap creation flow:
  `SVG -> Image() -> createjs.Bitmap`
- Bitmap lifecycle depends on async image loading callbacks
- Blocks maintain multiple bitmap states:
  - default bitmap
  - highlight bitmap
  - disconnected bitmap
  - collapse bitmap
- Turtle subsystem maintains sprite bitmap state and orientation separately from drawing logic
- Actual turtle drawing already uses native Canvas 2D API; CreateJS is primarily used for sprite/container rendering
- Bitmap generation already passes through helper functions, which may simplify renderer abstraction
- Some bitmap flows depend on CreateJS-specific bounds calculation and cache invalidation APIs

### Migration Risk
- Medium

---

## createjs.Shape

### Files
- js/block.js
- js/turtle.js
- js/trash.js
- js/boundary.js

### Purpose
- Hit areas for interaction detection
- Vector overlays and outlines
- UI boundary rendering

### Observations
- Shapes are frequently used as hit areas:
  `container.hitArea = new createjs.Shape()`
- Block interaction logic depends on CreateJS hit detection behavior
- Turtle sprites dynamically recalculate hit areas after reskinning
- boundary.js uses relatively isolated shape/bitmap composition with minimal interaction coupling
- Shape APIs appear replaceable with Konva Shape/Rect equivalents

### Migration Risk
- Medium

---

## createjs.Text

### Files
- js/block.js
- js/activity.js

### Purpose
- Render labels and UI text inside the canvas layer

### Observations
- Primarily used for block labels and canvas UI text
- Lower coupling compared to Bitmap and Container systems
- Likely straightforward migration target

### Migration Risk
- Low

---

## createjs.Tween

### Files
- js/activity.js
- activity/SugarAnimation.js

### Purpose
- UI animations
- Block highlighting
- Animation timing

### Observations
- Tween system appears partially coupled with render lifecycle management
- Animation orchestration may depend on active tween state
- SugarAnimation.js heavily depends on CreateJS animation APIs under the `cjs` alias
- Replacing Tween usage inside SugarAnimation.js may require manual rewrite or regeneration from Adobe Animate

### Migration Risk
- High

---

## createjs.Ticker

### Files
- js/activity.js

### Purpose
- Global rendering and animation timing
- Frame scheduling

### Observations
- Ticker framerate explicitly configured at 60 FPS
- Rendering loop includes idle optimization logic
- Mouse movement can manually trigger rendering updates through `__tick()`
- Rendering appears partially decoupled from continuous ticking for performance optimization

### Migration Risk
- High

---

# Subsystem Complexity Analysis

| Subsystem | Files | Complexity | Notes |
|---|---|---|---|
| Turtle Rendering | js/turtle.js, js/turtles.js | Medium | Actual drawing already uses Canvas 2D API; CreateJS mainly handles sprite composition and containers |
| Block Rendering | js/block.js | High | Heavy interaction logic, hit areas, caching, and bitmap state management |
| Trash | js/trash.js | Low | Relatively isolated subsystem with limited rendering complexity |
| Boundary | js/boundary.js | Low | Isolated rendering subsystem with simple container/bitmap composition and minimal interaction or animation coupling |
| SugarAnimation | activity/SugarAnimation.js | Very High | Auto-generated Adobe Animate export tightly coupled to CreateJS animation APIs |

---

# Candidate Replacement Libraries

## Konva.js

### Advantages
- Closest conceptual match to EaselJS/CreateJS architecture
- Provides Stage/Layer/Group/Image/Shape abstractions similar to existing codebase patterns
- Built-in hit detection and interaction handling
- Easier incremental migration path due to API similarity
- Well-suited for scene graph style rendering already used in Music Blocks

### Risks
- Additional abstraction layer over Canvas
- Some CreateJS-specific caching and bounds APIs may require adaptation
- Animation APIs differ from CreateJS Tween system

---

## PixiJS

### Advantages
- High-performance rendering
- WebGL acceleration
- Strong long-term ecosystem support

### Risks
- Larger architectural shift from current CreateJS patterns
- WebGL-first model may add unnecessary complexity
- More adaptation required for existing scene graph and interaction logic

---

## Native Canvas API

### Advantages
- Zero external rendering dependency
- Already partially used in turtle-painter.js
- Maximum long-term maintainability and control

### Risks
- Requires rebuilding scene graph, grouping, transforms, and interaction systems manually
- Significantly larger migration scope
- Higher implementation complexity and regression risk

---

# Proposed Migration Strategy

## Phase 1 — Audit & Renderer Abstraction
- Complete CreateJS usage audit
- Build compatibility matrix
- Introduce renderer abstraction layer to decouple subsystems from direct CreateJS usage
- Preserve CreateJS backend initially to reduce regression risk

## Phase 2 — Incremental Subsystem Migration
- Begin with low-risk isolated subsystems:
  - boundary.js
  - trash.js
- Migrate turtle sprite/container layer next
- Delay block rendering migration until abstraction layer stabilizes

## Phase 3 — Animation & Final Cleanup
- Replace Tween/Ticker orchestration
- Handle SugarAnimation.js separately
- Remove CreateJS dependencies entirely
- Run full visual and interaction regression validation

---

# Initial Conclusions

- CreateJS usage is concentrated primarily in scene graph management, bitmap composition, interaction handling, and animation orchestration.
- Turtle drawing logic already uses the native Canvas 2D API, reducing migration complexity for drawing operations.
- Rendering appears partially centralized through invalidation-based refresh flow (`refreshCanvas()`), which may simplify incremental renderer abstraction.
- The boundary subsystem appears to be the lowest-risk initial migration target due to isolated rendering responsibilities and minimal interaction coupling.
- A renderer abstraction layer may significantly reduce migration risk by enabling phased backend replacement instead of direct large-scale rewrites.
- An abstraction-first migration strategy appears safer than direct subsystem rewrites due to existing CreateJS-specific interaction and caching behaviors.
