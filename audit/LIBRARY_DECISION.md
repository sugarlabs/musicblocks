# Library Decision: Replacing CreateJS in MusicBlocks

## Problem

MusicBlocks currently depends on three CreateJS packages:

| Library | CDN file | Purpose |
|---------|----------|---------|
| EaselJS | `lib/easeljs.min.js` | Canvas display list (Stage, Container, Bitmap, Text, Shape) |
| TweenJS | `lib/tweenjs.min.js` | Property animation (Tween, Ease) |
| PreloadJS | `lib/preloadjs.min.js` | Asset loading (LoadQueue) |

All three are **abandoned** (last npm publish: EaselJS 2019, TweenJS 2019, PreloadJS 2019).
No security patches, no ES-module builds, no TypeScript types.

## Candidates Evaluated

| Library | Stars | Last release | ES module | Tree-shakeable | API similarity to EaselJS |
|---------|------:|-------------|-----------|----------------|--------------------------|
| **Konva** | 11k+ | Active (monthly) | Yes | Yes | High (Stage/Layer/Group/Image/Shape/Text) |
| PixiJS | 44k+ | Active | Yes | Partial | Medium (WebGL-first; different shape API) |
| Fabric.js | 28k+ | Active | Yes | No | Medium (object-based but different events) |
| Paper.js | 13k+ | Active | Yes | No | Low (vector-path focused) |
| Raw Canvas 2D | — | N/A | N/A | N/A | Low (imperative, no display list) |

## Decision: Konva.js

### Reasons

1. **Display-list model matches EaselJS 1:1.** Both use Stage → Layer/Container → Node hierarchy with `add()`, `remove()`, `visible`, `opacity/alpha`, `x/y`, `scaleX/Y`, `rotation`, `on(event, fn)`. Migration is largely mechanical find-and-replace.

2. **Built-in Tween.** `Konva.Tween` replaces `createjs.Tween`. Duration in seconds vs milliseconds is the only significant difference.

3. **Touch handled automatically.** Konva manages pointer/touch unification; `createjs.Touch.enable()` calls can simply be deleted.

4. **Active maintenance.** Monthly releases, security patches, ES-module dist, TypeScript types via `@types/konva`.

5. **Smallest migration surface.** PixiJS uses WebGL by default (Canvas 2D fallback only), which would break the pixel-level painting in `turtle-painter.js`. Konva uses Canvas 2D, consistent with the existing approach.

6. **npm install works today.** No post-install scripts, no native binaries, no peer-dependency conflicts with the existing stack.

### Known Differences to Handle

| Difference | Mitigation |
|---|---|
| Konva Stage needs a `<div>` container, not a raw `<canvas>` | Create wrapper div in `activity.js` init; pass canvas id or create new. |
| Property access is getter/setter (`node.x()`) not plain assignment (`node.x`) | `konva-adapter.js` wraps Konva classes to restore plain-property access for compatibility. |
| Tween duration is seconds, not ms | Divide all `.to(props, durationMs)` by 1000 during migration. |
| `createjs.Tween.hasActiveTweens()` does not exist in Konva | Track a global active-tween counter in adapter. |
| `createjs.ColorFilter` (invert) | Implement as a custom Konva filter function. |
| `createjs.DOMElement` | Replace with an absolutely-positioned DOM overlay. |
| `createjs.Graphics.getRGB` | Replace with inline `rgba()` string helper. |

## Migration Strategy

See `CREATEJS_AUDIT.md` for the full API mapping table.

Migration proceeds phase-by-phase (see issue #6612) so the app remains runnable at each checkpoint. The adapter shim (`js/konva-adapter.js`) bridges the gap during the transition period — files can be migrated one at a time while un-migrated files continue to use the global `createjs` variable provided by the shim.

Once all files are migrated:
- Delete `lib/easeljs.min.js`, `lib/tweenjs.min.js`, `lib/preloadjs.min.js`
- Remove the CDN `<script>` tags from `index.html`
- Remove `js/konva-adapter.js`
