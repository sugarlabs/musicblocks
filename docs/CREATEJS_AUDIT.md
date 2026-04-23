# CreateJS Migration Audit

## Summary

- **Total createjs.\* active API call sites found:** 105 (across 12 JS/HTML files)
- **Total cjs.\* active API call sites (SugarAnimation.js):** 477
- **Grand total across all audited files:** 582
- **Files affected:** 13
- **Unique createjs APIs used:** Stage, Container, Bitmap, Text, Shape, Tween, Ease, Ticker, Touch, DOMElement, ColorFilter
- **Unique cjs APIs used (SugarAnimation.js):** Shape, Rectangle, Container, Text, Tween, MovieClip

---

## Compatibility Matrix

| API | Used In | Line(s) | Purpose | Konva.js Equivalent |
|-----|---------|---------|---------|---------------------|
| `createjs.Stage` | activity.js, index.html | 8106; 1038 | Creates the root canvas rendering context | `new Konva.Stage({ container, width, height })` |
| `createjs.Container` | activity.js, block.js, blocks.js, boundary.js, pastebox.js, protoblocks.js, turtles.js, trash.js | multiple | Groups display objects in the scene graph | `new Konva.Group()` |
| `createjs.Bitmap` | activity.js, block.js, artwork.js, boundary.js, pastebox.js, planetInterface.js, protoblocks.js (none), turtle.js, turtles.js, trash.js | multiple | Renders an HTMLImageElement on the stage | `new Konva.Image({ image })` |
| `createjs.Text` | activity.js, block.js, protoblocks.js, turtle.js | multiple | Renders a text string on stage | `new Konva.Text({ text, fontSize, fill })` |
| `createjs.Shape` | activity.js, artwork.js, block.js, pastebox.js, turtles.js, turtle.js, trash.js (none, uses Tween) | multiple | Vector drawing surface with `.graphics` API | `new Konva.Shape({ sceneFunc })` or primitive subclass |
| `createjs.Tween.get()` | activity.js, artwork.js, block.js, trash.js | 538, 4995; 155, 164, 179, 180; 465; 175, 184 | Animates display object properties over time | `new Konva.Tween({ node, duration, ... }).play()` |
| `createjs.Tween.hasActiveTweens()` | activity.js | 538, 4995 | Dirty-flag check in render loop: forces redraw while tweens run | No direct equivalent; track Tween count or use `Konva.Animation` |
| `createjs.Ease.circInOut` | artwork.js | 162 | Easing function applied to a Tween | `Konva.Easings.EaseInOut` (closest) or custom bezier |
| `createjs.Ticker.framerate` | activity.js, index.html | 3162, 3183, 8111; 1040 | Sets the global animation frame rate | `Konva.Animation` does not cap fps; use `requestAnimationFrame` throttle |
| `createjs.Touch.enable()` | activity.js | 8107, 8641 | Enables pointer/touch events on the stage | Built into Konva; no explicit call needed |
| `createjs.DOMElement` | activity.js | 496 | Wraps a raw DOM element into the CreateJS display list | No equivalent; use an absolutely-positioned DOM overlay synchronized with stage transforms |
| `createjs.ColorFilter` | activity.js | 3043, 6178, 6206, 6274, 6341, 6406, 6477, 6543, 6610 | Inverts colors for dark-mode theming (`-1,-1,-1,1,255,255,255`) | `Konva.Filters.Invert` applied via `node.filters([Konva.Filters.Invert])` |
| `cjs.Shape` | SugarAnimation.js | ~274 sites | Vector paths for animation frames | `new Konva.Shape({ sceneFunc })` |
| `cjs.Rectangle` | SugarAnimation.js | ~78 sites | Bounding box objects (`nominalBounds`) | Plain `{ x, y, width, height }` object; no display counterpart needed |
| `cjs.Container` | SugarAnimation.js | ~77 sites | Animation clip groups | `new Konva.Group()` |
| `cjs.Text` | SugarAnimation.js | ~44 sites | Text nodes inside animation | `new Konva.Text(...)` |
| `cjs.Tween` | SugarAnimation.js | ~3 sites | Frame-state timeline tweens inside MovieClip | Custom Konva timeline or GSAP |
| `cjs.MovieClip` | SugarAnimation.js | 2328 | Root clip driving the frame-based animation | No equivalent; requires full rewrite as `Konva.Animation` with manual frame state |

---

## File-by-File Breakdown

### js/block.js — 30 usages — HIGH

| Line | API | Purpose |
|------|-----|---------|
| 229 | `createjs.Bitmap` | Block background image bitmap |
| 465 | `createjs.Tween.get(...).to(...)` | Animates block container position during drag (override: true) |
| 1053 | `createjs.Text` | Main text label rendered inside the block |
| 1072 | `createjs.Bitmap` | Block artwork image |
| 1659 | `createjs.Bitmap` | Collapse button bitmap |
| 1690 | `createjs.Bitmap` | Expand button bitmap |
| 1730–1870 | `createjs.Text` (×26) | Localized collapse-label text for all supported languages |
| 2255 | `createjs.Bitmap` | Bitmap for secondary block decoration |
| 2258 | `createjs.Container` | Container wrapping block decoration elements |
| 3034 | `createjs.Shape` | Invisible hit-area shape for click/touch detection |

**Notes:** The 26 `createjs.Text` calls at lines 1730–1870 are a locale-dispatch block; they set `collapseText` conditionally for each language but use the same API pattern. The Tween at line 465 uses `override: true`, which cancels any in-progress tween on the same target — this behaviour must be replicated with `Konva.Tween`'s `reset()`/`destroy()` before creating a new one.

---

### js/activity.js — 35 active usages (1 commented) — HIGH

| Line | API | Purpose |
|------|-----|---------|
| 496 | `createjs.DOMElement` | Wraps the paste DOM element into the stage display list |
| 538 | `createjs.Tween.hasActiveTweens()` | Checks whether a tween is in-flight; used as a gate before stage update |
| 3023 | `createjs.Container` | Container for action button UI element |
| 3026 | `createjs.Bitmap` | Bitmap for action button icon |
| 3043 | `createjs.ColorFilter(-1,-1,-1,1,255,255,255)` | Inverts action button colors in dark mode |
| 3058 | `createjs.Container` | Container for error/message block |
| 3073 | `createjs.Bitmap` | Bitmap for message block icon |
| 3075 | `createjs.Text` | Placeholder text inside message block |
| 3085 | `createjs.Shape` | Hit area for message block |
| 3162 | `createjs.Ticker.framerate = ACTIVE_FPS` | Raises frame rate when user is actively interacting |
| 3183 | `createjs.Ticker.framerate = IDLE_FPS` | Lowers frame rate during idle to reduce CPU usage |
| 3221 | `createjs.Container` | Container for palette item |
| 3231 | `createjs.Bitmap` | Palette item artwork |
| 3233 | `createjs.Text` | Palette item label |
| 3241 | `createjs.Shape` | Hit area for palette item |
| 4995 | `createjs.Tween.hasActiveTweens()` | Render-loop dirty check — forces `stage.update()` while tweens are running |
| 6018 | `createjs.Container` | Container for error-message arrow indicator |
| 6022 | `createjs.Shape` | Arrow line shape |
| 6032 | `createjs.Shape` | Arrow head shape |
| 6178 | `createjs.ColorFilter` | Invert filter for dark-mode block theming (×8, lines 6178–6610) |
| 7764 | `createjs.Bitmap` | Bitmap added to display list during media load |
| 8106 | `createjs.Stage` | Creates the main stage bound to `this.canvas` |
| 8107 | `createjs.Touch.enable(this.stage)` | Enables pointer/touch events on initial stage creation |
| 8111 | `createjs.Ticker.framerate = 60` | Sets initial ticker framerate |
| 8175 | `createjs.Container` | `blocksContainer` — root container for all blocks |
| 8176 | `createjs.Container` | `trashContainer` — root container for trash UI |
| 8177 | `createjs.Container` | `turtleContainer` — root container for all turtles |
| 8638 | ~~`createjs.LoadQueue`~~ | **Commented out** — was asset preloader, already disabled |
| 8641 | `createjs.Touch.enable(this.stage, false, true)` | Re-enables multi-touch on resize/reload |

**Notes:** The `hasActiveTweens()` check at lines 538 and 4995 is tightly coupled to the render loop's dirty-flag pattern. Removing CreateJS Tween means this check must be replaced — Konva's `Konva.Tween` does not expose a global active-tweens query. The `createjs.DOMElement` at line 496 has no Konva equivalent; a positioned DOM overlay will be required. The `ColorFilter` pattern (9 instances) always uses the same inversion constants and maps cleanly to `Konva.Filters.Invert`.

---

### js/turtle.js — 8 usages — MEDIUM

| Line | API | Purpose |
|------|-----|---------|
| 798 | `createjs.Bitmap` | Initial turtle avatar bitmap |
| 833 | `item instanceof createjs.Bitmap` | Type-guard walking the turtle image container's display list |
| 859 | `createjs.Bitmap` | Turtle body bitmap (loaded from image data URI) |
| 876 | `createjs.Shape` | Hit area covering the turtle for pointer events |
| 889 | `createjs.Bitmap` | Decoration bitmap overlaid on turtle |
| 956 | `createjs.Text` | Single-line turtle name label |
| 982 | `createjs.Text` | Multi-line turtle name label (per line of text) |
| 1026 | `createjs.Bitmap` | Turtle status/icon bitmap |

**Notes:** The `instanceof createjs.Bitmap` check at line 833 iterates `turtle.imageContainer.children` to find bitmaps for removal. After migration, the equivalent check will be `node instanceof Konva.Image` (or a tag/name query).

---

### js/turtles.js — 7 usages — MEDIUM

| Line | API | Purpose |
|------|-----|---------|
| 394 | `createjs.Container` | `_borderContainer` for collapsed/expanded turtle boundary display |
| 504 | `createjs.Container` | `turtle.imageContainer` — holds avatar bitmaps |
| 506 | `createjs.Bitmap` | `turtle.penstrokes` — off-screen bitmap for rendered turtle drawings |
| 509 | `createjs.Container` | `turtle.container` — root container for a single turtle |
| 522 | `createjs.Shape` | Hit area for turtle interaction |
| 1225 | `createjs.Bitmap` | Collapsed-view boundary bitmap |
| 1264 | `createjs.Bitmap` | Expanded-view boundary bitmap |

**Notes:** `turtle.penstrokes` at line 506 is created as an empty `Bitmap()` (no image arg) and later has its `.image` replaced with a canvas element that accumulates pen strokes. In Konva, this maps to `new Konva.Image({ image: offscreenCanvas })` with manual invalidation via `node.cache()` or direct canvas updates.

---

### js/trash.js — 6 usages — MEDIUM

| Line | API | Purpose |
|------|-----|---------|
| 33 | `createjs.Container` | Root trash-zone container |
| 57 | `createjs.Bitmap` | Highlight border bitmap (shown on drag-over) |
| 97 | `createjs.Bitmap` | Normal border bitmap |
| 117 | `createjs.Bitmap` | Trash icon bitmap |
| 175 | `createjs.Tween.get(this._container).to({ alpha: 0 }, 200).set({ visible: false })` | Fades container out then hides it |
| 184 | `createjs.Tween.get(this._container).to({ visible: true }).to({ alpha: 1 }, 200)` | Makes container visible then fades in |

**Notes:** The Tween chain at line 175 combines a property animation (`.to`) with a setter (`.set`) in one chain. The Konva equivalent is `new Konva.Tween({ node, opacity: 0, duration: 0.2, onFinish: () => node.hide() }).play()`.

---

### js/boundary.js — 2 usages — LOW

| Line | API | Purpose |
|------|-----|---------|
| 28 | `createjs.Container` | Root boundary container |
| 87 | `createjs.Bitmap` | Boundary image bitmap |

---

### js/pastebox.js — 3 usages — LOW

| Line | API | Purpose |
|------|-----|---------|
| 64 | `createjs.Container` | Paste-box display container |
| 104 | `createjs.Shape` | Hit area for paste-box clicks |
| 150 | `createjs.Bitmap` | Paste-box icon bitmap |

---

### js/blocks.js — 1 usage — LOW

| Line | API | Purpose |
|------|-----|---------|
| 3369 | `createjs.Container` | Creates a new container for a programmatically built block |

---

### js/protoblocks.js — 2 usages — LOW

| Line | API | Purpose |
|------|-----|---------|
| 93 | `createjs.Container` | Container holding the palette block visual |
| 94 | `createjs.Text` | Fallback text label for a palette block with no artwork |

---

### js/artwork.js — 8 active usages (4 JSDoc type annotations) — MEDIUM

| Line | API | Purpose |
|------|-----|---------|
| 136 | `{createjs.Stage}` | **JSDoc type annotation only** — no runtime usage |
| 141 | `createjs.Shape` | Highlight-circle shape for palette hover animation |
| 142 | `createjs.Shape` | Active-circle shape for palette hover animation |
| 155 | `createjs.Tween.get(...)` | Animates active circle scale and position on hover |
| 162 | `createjs.Ease.circInOut` | Easing applied to scale/position tween |
| 164 | `createjs.Tween.get(...)` | Animates active circle alpha pulse |
| 171 | `{createjs.Stage}` | **JSDoc type annotation only** |
| 179 | `createjs.Tween.get(...)` | Fades active circle out on hover exit |
| 180 | `createjs.Tween.get(...)` | Fades highlight circle out on hover exit |
| 188 | `{createjs.Text}` | **JSDoc type annotation only** |
| 189 | `{createjs.Stage}` | **JSDoc type annotation only** |
| 219 | `createjs.Bitmap` | Bitmap created and added for artwork overlay |

**Notes:** This file uses `createjs.Ease.circInOut` — the closest Konva equivalent is `Konva.Easings.EaseInOut`. The precise curve differs; if pixel-identical animation is required, a custom cubic-bezier must be supplied.

---

### js/planetInterface.js — 1 usage — LOW

| Line | API | Purpose |
|------|-----|---------|
| 219 | `createjs.Bitmap` | Bitmap for a planet interface icon |

---

### index.html — 2 active usages (1 commented) — LOW

| Line | API | Purpose |
|------|-----|---------|
| 1038 | `createjs.Stage` | Inline script creates a stage bound to the `canvas` element |
| 1040 | `createjs.Ticker.framerate = 60` | Sets ticker framerate in the inline bootstrap script |
| 1041 | ~~`createjs.Ticker.addEventListener`~~ | **Commented out** — tick-driven stage updates disabled |

**Notes:** This inline stage creation in `index.html` appears to be a bootstrap path separate from the main `Activity` class. It may be dead code for the standard app load; verify whether this script block actually runs in the production entry path before migrating.

---

### activity/SugarAnimation.js — 477 cjs.\* usages — HIGH

| API | Count | Purpose |
|-----|-------|---------|
| `cjs.Shape` | ~274 | Vector path shapes constituting each animation frame's artwork |
| `cjs.Rectangle` | ~78 | `nominalBounds` bounding-box descriptors on each library symbol |
| `cjs.Container` | ~77 | Grouping containers for animation clip symbols |
| `cjs.Text` | ~44 | Text elements embedded in animation frames |
| `cjs.Tween` | ~3 | Frame-state timeline tweens used inside the `MovieClip` |
| `cjs.MovieClip` | 1 | Root animated clip (line 2328), the top-level animation object |

**Special Case — Auto-generated file:** This file is machine-generated output from Adobe Animate (formerly Flash) using the `createjs` export option. The alias `cjs = createjs` is introduced by the IIFE wrapper `(function(lib, img, cjs) { ... })(lib, images, createjs)` at line 1/2331. The file is **not hand-authored** and cannot be incrementally refactored — it must be treated as an opaque unit and replaced wholesale. Replacement options:
1. Re-export the original source animation as an SVG or CSS/Web Animations API sequence (requires the original `.fla` source file).
2. Rewrite as a `Konva.Animation` + `Konva.Group` hierarchy (high effort, ~2331 lines).
3. Replace with a CSS sprite sheet or video element if the animation content is purely decorative.
4. Use a purpose-built JS animation library (GSAP, anime.js) as an intermediate step before full Konva unification.

---

## Special Cases

### SugarAnimation.js — `cjs` Alias

The entire file is wrapped in `(function(lib, img, cjs) { ... })(lib, images, createjs)`. The local name `cjs` refers to the same global `createjs` object. All 477 usages are through this alias. The file is the only place in the codebase that uses the `cjs` alias; everywhere else uses `createjs` directly.

### `createjs.Tween.hasActiveTweens()` — Render Loop Coupling

`activity.js` calls `createjs.Tween.hasActiveTweens()` at two sites (lines 538 and 4995) inside the render-loop tick handler. This is the codebase's dirty-flag mechanism: the stage is only re-rendered if either `this.update` is set or a tween is in progress. CreateJS's global Tween registry makes this a single static call. Konva does not expose such a registry. After migration, this pattern must be replaced with either:
- Explicit dirty-flag management (increment a counter when a `Konva.Tween` starts, decrement on `onFinish`)
- Using `Konva.Animation`, which integrates with the render loop automatically and eliminates the need for the check

### turtle-painter.js — Already on Native Canvas 2D

`js/turtle-painter.js` (not in the audit list) already uses the browser's native Canvas 2D API directly (`ctx.beginPath`, `ctx.moveTo`, `ctx.lineTo`, etc.) without CreateJS. It is **already migrated** and requires no changes.

---

## Migration Risk Assessment

| File | Risk | Reason |
|------|------|--------|
| js/blocks.js | **LOW** | Single `Container` creation |
| js/planetInterface.js | **LOW** | Single `Bitmap` creation |
| js/protoblocks.js | **LOW** | One `Container` + one `Text` |
| js/boundary.js | **LOW** | One `Container` + one `Bitmap` |
| js/pastebox.js | **LOW** | `Container` + `Shape` (hit area) + `Bitmap` |
| index.html | **LOW** | Two active calls; likely bootstrap-only path, may be dead code |
| js/turtles.js | **MEDIUM** | Moderate usage; `penstrokes` Bitmap requires off-screen canvas understanding |
| js/trash.js | **MEDIUM** | Tween chain with `.set()` step requires careful Konva translation |
| js/turtle.js | **MEDIUM** | `instanceof createjs.Bitmap` type-check must be updated throughout |
| js/artwork.js | **MEDIUM** | Tween + `Ease.circInOut` with no direct Konva equivalent |
| js/block.js | **HIGH** | 30 usages including Tween `override:true`, 26 locale-branched `Text` calls |
| js/activity.js | **HIGH** | Core orchestrator: Stage, Touch, Ticker, `hasActiveTweens()`, `DOMElement`, 9× `ColorFilter` |
| activity/SugarAnimation.js | **HIGH** | 477 usages, machine-generated, uses `MovieClip`, must be replaced wholesale |

---

## Recommended Migration Order

Migrate from easiest to hardest to minimize risk at each step. Each file below can be migrated and tested independently.

1. **js/blocks.js** — 1 usage; isolated `Container` creation
2. **js/planetInterface.js** — 1 usage; isolated `Bitmap` creation
3. **js/protoblocks.js** — 2 usages; `Container` + `Text`
4. **js/boundary.js** — 2 usages; `Container` + `Bitmap`
5. **js/pastebox.js** — 3 usages; `Container` + `Shape` + `Bitmap`
6. **index.html** — 2 active usages; verify if the inline script is actually executed before migrating
7. **js/turtles.js** — 7 usages; migrate alongside turtle.js (shared data structures)
8. **js/turtle.js** — 8 usages; update `instanceof` checks at the same time as turtles.js
9. **js/trash.js** — 6 usages; Tween chain needs careful mapping
10. **js/artwork.js** — 8 usages; Tween + Ease requires custom easing decision
11. **js/block.js** — 30 usages; large surface area, Tween `override` semantics, 26 locale branches
12. **js/activity.js** — 35 usages; migrate last among JS files; owns Stage lifecycle, Ticker, Touch, render loop gate
13. **activity/SugarAnimation.js** — 477 usages; plan and execute as a standalone project; do not attempt incremental migration
