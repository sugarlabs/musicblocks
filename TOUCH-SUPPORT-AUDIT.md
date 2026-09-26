# Music Blocks — Touch Support Audit (Block Dragging)

**Related issue:** [#6608](https://github.com/sugarlabs/musicblocks/issues/6608)
**Requested by:** Devin Ulibarri (pikurasa)
**Status:** Root cause narrowed — pending real-device verification
**Scope:** Block dragging via touch, desktop Chromium (mobile audit to follow)
**Tooling used:** Chrome DevTools (device toolbar + Sensors panel forced-touch
emulation), manual console instrumentation, static code review

This report documents the current state of touch support for block dragging
in Music Blocks, prompted by reports that students on desktop Chromium
touchscreens cannot drag blocks. It covers what currently works, what's
broken, and what's dead code unrelated to the reported bug.

---

## Summary

| Area | Status |
|------|--------|
| Touch press detection (`touchstart` → `mousedown`) | ✅ Working |
| Touch drag (`touchmove` → `pressmove`) | ❌ Broken — confirmed root cause area |
| Touch long-press context menu | ❌ Dead code — never fires |
| Redundant `Touch.enable()` call | ⚠️ No-op, safe to remove |

---

## Findings

### 1. Touch press detection works correctly
- **Status:** ✅ Working
- **Mechanism:** `createjs.Touch.enable(this.stage)` (`js/activity.js:7220`)
  translates native touch events into EaselJS's synthesized mouse-style
  event system.
- **Verification:** Instrumented `js/block.js:3190` (`mousedown` handler)
  with a temporary `console.log` of `event.nativeEvent`. With Chrome's
  Sensors panel set to **Touch: Force enabled**, a tap on a block produced:

  ```
  [TOUCH DEBUG] mousedown fired touchstart
  nativeEvent: TouchEvent {isTrusted: true, touches: TouchList, ...}
  ```
  
  Confirms real touch input correctly reaches the block container and is
  translated into `mousedown` as designed.

---

### 2. Touch drag does not work — `pressmove` never fires
- **Status:** ❌ Confirmed broken — matches reported symptom exactly
- **Element:** `this.container.on("pressmove", ...)` (`js/block.js:3286`)
- **Verification:** Instrumented the `pressmove` handler with a temporary
  `console.log` as its first line. Performed a clean, isolated
  press-hold-drag-release gesture with console cleared beforehand.
  Result: `mousedown` logged once (confirming press was detected);
  **`pressmove` never logged**, despite a continuous drag motion.
- **Investigation:** Reviewed the full `pressmove` handler body
  (`js/block.js:3295–3400`) for guard clauses that might silently skip
  touch input (e.g. a mouse-button check) — none found. Since the log
  statement is the first line in the callback and never printed, the
  callback itself is never invoked by EaselJS for this gesture.
- **Conclusion:** The gap is isolated to the `touchmove` → `pressmove`
  translation step in the EaselJS touch-handling layer, not in Music
  Blocks' own drag logic. This is a different code path from `touchstart`
  → `mousedown`, which works correctly — explaining why the block appears
  responsive to touch (registers a press) but cannot be dragged.
- **Open question:** Whether this is specific to Chrome DevTools' touch
  emulation (which has known limitations simulating sustained drag
  gestures) or reproduces identically on a real touchscreen device.
  **Needs live-device verification before further root-causing.**

---

### 3. Touch long-press context menu is dead code
- **Status:** ❌ Non-functional, unrelated to the drag bug
- **Element:** `this.container.on("touchstart"/"touchmove"/"touchend", ...)`
  (`js/block.js:3489–3512`)
- **Details:** EaselJS `Container`/`DisplayObject` only dispatches its own
  synthesized event set (`mousedown`, `pressmove`, `pressup`, `click`,
  etc.) — it does not re-dispatch raw `"touchstart"`/`"touchmove"`/
  `"touchend"` as container-level events. No code elsewhere in the
  repository manually dispatches these event names either, confirmed via
  full-repo search. These three listeners are effectively dead code and
  never fire.

---

### 4. Redundant `Touch.enable()` call
- **Status:** ⚠️ No-op, safe cleanup
- **Element:** `js/activity.js:7768` —
  `createjs.Touch.enable(this.stage, false, true)`
- **Details:** A second call to `Touch.enable()` on the same stage.
  EaselJS guards against double-enabling internally (checks
  `stage.__touch`, set by the first call at `js/activity.js:7220`), so
  this line has no effect. Harmless today, but confusing to future readers
  since its `allowDefault: true` argument implies different behavior than
  what's actually active.

---

## Next steps

- [ ] Verify the `pressmove` gap on a real touchscreen device (Chromebook
      or touchscreen Windows laptop) to rule out a DevTools-emulation-only
      artifact.
- [ ] If confirmed on real hardware, trace EaselJS's touch identifier
      tracking (`_handleStart`/`_handleMove` in `lib/easeljs.min.js`) to
      find why `touchmove` isn't reaching the stage's pointer-move
      dispatch for an already-tracked touch.
- [ ] Remove dead `touchstart`/`touchmove`/`touchend` container listeners
      in `js/block.js`, or replace with functional long-press detection
      built on `pressmove` timing instead.
- [ ] Remove the redundant `Touch.enable()` call in `js/activity.js:7768`.
- [ ] Once drag is fixed, re-test full touch flow: press → drag → snap/
      connect → release, plus trash-can drop behavior.
- [ ] Extend audit to mobile (phone/tablet) touch behavior once desktop
      Chromium is resolved.