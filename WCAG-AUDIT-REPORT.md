# Music Blocks — WCAG 2.1 AA Audit Report

**Related issue:** [#6608](https://github.com/sugarlabs/musicblocks/issues/6608)
**Status:** In progress — 16 → 1 violations resolved
**Tooling used:** axe DevTools (axe-core 4.11.4), Chrome DevTools, manual keyboard navigation
**Test URL:** `http://127.0.0.1:3000/` (local dev server, `npm run serve`)

This report documents accessibility violations found during a WCAG 2.1 AA
audit of Music Blocks, along with the affected files, severity, and
recommended fixes. It will be updated incrementally as more of the
application (toolbar, palettes, widgets, modals) is audited.

---

## Summary

| Severity | Original | Remaining |
|----------|----------|-----------|
| Critical | 14       | 0         |
| Serious  | 2        | 1         |
| Moderate | 0        | 0         |
| Minor    | 0        | 0         |
| **Total** | **16**  | **1**     |

---

## Findings

### 1. Insufficient color contrast on tour/help tooltip text
- **Status:** ⚠️ Open — known remaining issue
- **Severity:** Serious (1 instance)
- **WCAG criterion:** 1.4.3 Contrast (Minimum) — AA
- **Rule:** `color-contrast` (axe)
- **Element:** `<div class="wftTitle" id="helpWidgetID">Take a tour</div>`
- **Details:** Foreground `#d1d5db` on background `#2196f3` produces a
  contrast ratio of **2.12:1**. WCAG AA requires **4.5:1** for normal text.
- **Investigation:** The background color is not set in any CSS or JS file
  found after an extensive search — it appears to be applied at runtime by
  a third-party or dynamically-generated style. Root source not yet
  identified.
- **Decision:** Documenting as a known remaining issue rather than guessing
  at a fix location. Will revisit if the source is identified during the
  touch support or aria-label audit work.

---

### 2. Palette category icons missing accessible names
- **Status:** ✅ Fixed (PR [#7564](https://github.com/sugarlabs/musicblocks/pull/7564))
- **Severity:** Critical (13 instances)
- **WCAG criterion:** 1.1.1 Non-text Content — A (blocks AA compliance)
- **Rule:** `image-alt` (axe)
- **Element pattern:** `td[role="tab"] > img[width="42"][height="42"]`
- **Fix applied:** Added `alt` text / `aria-label="<Palette name> palette"`
  to each of the 13 palette tab icons in `js/palette.js`.

---

### 3. Paste input button has no discernible text
- **Status:** ✅ Fixed
- **Severity:** Critical (1 instance)
- **WCAG criterion:** 4.1.2 Name, Role, Value — A (blocks AA compliance)
- **Rule:** `input-button-name` (axe)
- **Element:** `<input onkeypress="doPaste()" type="submit" value="" tabindex="-1">`
- **Fix applied:** Added `aria-label="Paste"`.

---

### 4. Scrollable help/tour region not keyboard accessible
- **Status:** ✅ Fixed (branch `fix/remaining-axe-violations`)
- **Severity:** Serious (2 instances)
- **WCAG criterion:** 2.1.1 Keyboard — A (blocks AA compliance)
- **Rule:** `scrollable-region-focusable` (axe)
- **Element:** `helpScrollWrapper` in `js/widgets/help.js`
- **Details:** The scrollable help content wrapper had no way to receive
  keyboard focus, so keyboard-only users could not scroll it.
- **Fix applied:** Added `tabIndex = 0` to `helpScrollWrapper` (lines 118
  and 728 in `js/widgets/help.js`).

---

### 5. Persistent notification banner insufficient contrast
- **Status:** ✅ Fixed (PR [#7896](https://github.com/sugarlabs/musicblocks/pull/7896), tokens hardened on `fix/remaining-axe-violations`)
- **Severity:** Serious
- **WCAG criterion:** 1.4.3 Contrast (Minimum) — AA
- **Rule:** `color-contrast` (axe)
- **Element:** `#persistentNotification`
- **Fix applied:** Replaced hardcoded hex colors with
  `--color-notification-bg` (`#1d4ed8`) and `--color-notification-text`
  (`#ffffff`) tokens, defined in `css/tokens.css` across light, dark, and
  highcontrast sections, and referenced via `var(...)` in
  `css/activities.css`.

---

## Cross-cutting issues (from manual review)

- **TAB key trap** in `js/activity.js` (~line 3812) — **Fixed** (PR
  [#7563](https://github.com/sugarlabs/musicblocks/pull/7563)). Tab is now
  only suppressed when focus is on the canvas/body; real DOM elements
  receive normal Tab navigation. *(WCAG 2.1.2 No Keyboard Trap)*
- **Focus indicator suppressed on `#search` input** in
  `css/activities.css` — `outline: none` on `#search:focus` removes the
  visible focus ring for keyboard users. *(WCAG 2.4.7 Focus Visible)*
  Still open — not yet re-scanned.

---

## Next steps

- [x] Fix palette icon labels, paste button label, TAB trap, notification
      contrast, help scroll region keyboard access.
- [ ] Identify and fix the runtime-set `#helpWidgetID` background contrast
      issue (1 remaining violation).
- [ ] Re-check `#search:focus` outline suppression.
- [ ] Audit the toolbar (play/stop/save/etc.) and modal dialogs
      (`#clear-modal-container`, `#cleardropdown`) for missing
      `aria-label`/`role`.
- [ ] Audit widget windows (`#floatingWindows`) — oscilloscope, sampler,
      pitch staircase, etc.
- [ ] Touch support audit — block dragging via touch, desktop Chromium
      first, then mobile.
- [ ] Block connected/snapped announcement (aria-live).
- [ ] Manual keyboard walkthrough: confirm Tab/Shift+Tab order across
      toolbar → palette → canvas is logical.
- [ ] Manual screen reader pass (VoiceOver) once ARIA labeling work
      completes.