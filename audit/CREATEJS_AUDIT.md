# CreateJS API Audit — MusicBlocks

Auto-generated 2026-05-12. Total references: 127 across 20 files (excluding test files).

---

## Summary by File

| File | Count | APIs Used |
|------|------:|-----------|
| `js/activity.js` | 36 | Stage, Container, Bitmap, Text, Shape, ColorFilter, DOMElement, Ticker, Touch, Tween |
| `js/block.js` | 30 | Bitmap, Container, Text, Shape, Tween |
| `js/artwork.js` | 11 | Shape, Tween, Ease |
| `js/turtle.js` | 8 | Bitmap, Shape, Text |
| `js/turtles.js` | 7 | Container, Bitmap, Shape |
| `js/trash.js` | 6 | Container, Bitmap, Tween |
| `js/pastebox.js` | 3 | Container, Shape, Bitmap |
| `js/protoblocks.js` | 2 | Container, Text |
| `js/boundary.js` | 2 | Container, Bitmap |
| `js/blocks.js` | 1 | Container |
| `js/themebox.js` | 1 | ColorFilter |
| `js/planetInterface.js` | 1 | Bitmap |
| `js/utils/utils.js` | 1 | Stage (detection only) |
| `js/utils/munsell.js` | 1 | Graphics.getRGB |
| `index.html` | 3 | Stage, Ticker |

---

## API Compatibility Matrix

### EaselJS → Konva

| CreateJS API | Konva Equivalent | Notes |
|---|---|---|
| `createjs.Stage(canvas)` | `new Konva.Stage({ container, width, height })` | Konva Stage takes a container div, not a canvas element. Must create a wrapper div. |
| `stage.update()` | `layer.batchDraw()` | Konva auto-batches; explicit draw is rarely needed. |
| `new createjs.Container()` | `new Konva.Group()` | Direct equivalent. Supports `add()`, `removeAllChildren()`, `visible`, `x/y`, `alpha` → `opacity`. |
| `container.addChild(node)` | `group.add(node)` | Identical pattern. |
| `container.removeChild(node)` | `node.destroy()` | Or `node.remove()` to detach without destroying. |
| `container.removeAllChildren()` | `group.destroyChildren()` | Direct equivalent. |
| `new createjs.Bitmap(imgSrc)` | `new Konva.Image({ image })` | Konva requires a pre-loaded HTMLImageElement. Use `Konva.Image.fromURL(src, cb)` for convenience. |
| `bitmap.image` | `konvaImage.image()` | Getter/setter. |
| `new createjs.Text(str, font, color)` | `new Konva.Text({ text, fontFamily, fontSize, fill })` | Font string must be parsed ("20px Arial" → `{ fontSize: 20, fontFamily: "Arial" }`). |
| `text.text` | `konvaText.text()` | Getter/setter. |
| `new createjs.Shape()` | `new Konva.Shape({ sceneFunc })` or specific primitives | For hit areas use `new Konva.Rect()`; for arbitrary graphics use `Konva.Shape` with `sceneFunc`. |
| `shape.graphics` (EaselJS Graphics) | `konvaShape.sceneFunc((ctx, shape) => {...})` | Canvas 2D context is exposed directly in `sceneFunc`. |
| `new createjs.ColorFilter(...)` | Custom Konva filter via `filters: [fn]` | Konva has built-in `Konva.Filters.RGBA`; for invert use a custom filter. |
| `createjs.Touch.enable(stage)` | Built-in | Konva handles touch natively; no setup needed. |
| `node.x / node.y` | `node.x() / node.y()` | Konva uses getter/setter methods, not plain properties. |
| `node.scaleX / node.scaleY` | `node.scaleX() / node.scaleY()` | Same pattern. |
| `node.alpha` | `node.opacity()` | Range 0–1 in both. |
| `node.visible` | `node.visible()` | Getter/setter in Konva. |
| `node.rotation` | `node.rotation()` | Degrees in both. |
| `node.getBounds()` | `node.getClientRect()` | Returns `{ x, y, width, height }`. |
| `stage.getObjectsUnderPoint(x, y)` | `stage.getIntersection({ x, y })` | Returns topmost node only; iterate layers for full list. |
| `node.on("click", fn)` | `node.on("click", fn)` | Identical event API. |
| `node.on("pressmove", fn)` | `node.on("dragmove", fn)` + `node.draggable(true)` | Konva uses its own drag system. |

### TweenJS → Konva.Tween / gsap

| CreateJS API | Konva Equivalent | Notes |
|---|---|---|
| `createjs.Tween.get(target)` | `new Konva.Tween({ node, ... })` | Konva Tween is node-bound from construction. |
| `.to({ props }, duration, ease)` | `new Konva.Tween({ node, duration, easing, ...props })` | Duration in **seconds** in Konva (not ms). |
| `.set({ props })` | `node.setAttrs(props)` | Immediate property set. |
| `createjs.Ease.circInOut` | `Konva.Easings.EaseInOut` | Konva has limited easings; use `gsap` for full suite if needed. |
| `createjs.Tween.hasActiveTweens()` | Not directly available | Track manually with a counter, or use gsap's `gsap.isTweening(node)`. |
| `tween.play()` | `tween.play()` | Same API. |
| `tween.pause()` | `tween.pause()` | Same API. |

### PreloadJS → Browser fetch / HTMLImageElement

| CreateJS API | Equivalent | Notes |
|---|---|---|
| `createjs.LoadQueue` | `new Image(); img.src = url` or `fetch()` | MusicBlocks uses LoadQueue sparingly; replace with standard Image loading. |

### Ticker → requestAnimationFrame

| CreateJS API | Replacement | Notes |
|---|---|---|
| `createjs.Ticker.framerate = N` | `Konva` manages its own RAF loop | Set `Konva.autoDrawEnabled = false` to take manual control. |
| `createjs.Ticker.addEventListener("tick", fn)` | `Konva.Animation` or manual `requestAnimationFrame` | `new Konva.Animation(fn, layer)` provides a per-frame callback. |

### Misc

| CreateJS API | Replacement | Notes |
|---|---|---|
| `createjs.DOMElement(el)` | Overlay a plain DOM element | Konva does not wrap DOM elements; position an absolute div over the canvas. |
| `createjs.Graphics.getRGB(r,g,b,a)` | `rgba(r,g,b,a)` string | Replace with a simple inline helper. |
| `typeof createjs !== "undefined"` | `typeof Konva !== "undefined"` | Feature detection in `utils/utils.js`. |

---

## Files NOT to Migrate

| File | Reason |
|---|---|
| `js/turtle-painter.js` | Already uses native Canvas 2D API directly — no createjs usage. Do not touch. |
| `activity/SugarAnimation.js` | Adobe Animate export — full rewrite required separately (Phase 7). |
| `js/__tests__/*.test.js` | Test mocks update automatically after source migration. |

---

## Migration Priority Order

1. `js/activity.js` — Stage init, Ticker, Touch (foundation; all others depend on Stage)
2. `js/block.js` — Heaviest file; most complex shapes and tweens
3. `js/turtle.js` + `js/turtles.js` — Sprite/image rendering
4. `js/trash.js`, `js/boundary.js`, `js/pastebox.js`, `js/blocks.js`, `js/protoblocks.js`
5. `js/artwork.js` — Tween-heavy highlight animations
6. `js/themebox.js`, `js/planetInterface.js`, `js/utils/munsell.js`, `js/utils/utils.js` — Isolated 1-line usages
7. `index.html` — Stage bootstrap (remove after activity.js migration)
