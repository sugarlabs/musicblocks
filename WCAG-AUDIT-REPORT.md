# Music Blocks — WCAG 2.1 AA Audit Report

**Related issue:** [#6608](https://github.com/sugarlabs/musicblocks/issues/6608)
**Status:** In progress — first pass (home/launch screen)
**Tooling used:** axe DevTools (axe-core 4.11.4), Chrome DevTools, manual keyboard navigation
**Test URL:** `http://127.0.0.1:3000/` (local dev server, `npm run serve`)

This report documents accessibility violations found during a WCAG 2.1 AA
audit of Music Blocks, along with the affected files, severity, and
recommended fixes. It will be updated incrementally as more of the
application (toolbar, palettes, widgets, modals) is audited.

---

## Summary (first pass)

| Severity | Count |
|----------|-------|
| Critical | 14 |
| Serious  | 2 |
| Moderate | 0 |
| Minor    | 0 |
| **Total** | **16** |

---

## Findings

### 1. Insufficient color contrast on tour/help tooltip text
- **Severity:** Serious (2 instances)
- **WCAG criterion:** 1.4.3 Contrast (Minimum) — AA
- **Rule:** `color-contrast` (axe)
- **Element:** `<div class="wftTitle" id="helpWidgetID">Take a tour</div>`
- **Details:** Foreground `#e8e8e8` on background `#2196f3` produces a
  contrast ratio of **2.54:1**. WCAG AA requires **4.5:1** for normal text.
- **Likely file:** `css/activities.css` / `css/themes.css` (`.wftTitle`,
  `#helpWidgetID`, and related "Take a tour" tooltip styles)
- **Recommended fix:** Darken the background or use a darker/higher-contrast
  text color so the ratio meets ≥4.5:1. Verify with a contrast checker
  (e.g. TPGi Colour Contrast Analyser).

---

### 2. Palette category icons missing accessible names
- **Severity:** Critical (13 instances)
- **WCAG criterion:** 1.1.1 Non-text Content — A (blocks AA compliance)
- **Rule:** `image-alt` (axe)
- **Element pattern:** `td[role="tab"] > img[width="42"][height="42"]`
  (SVG data-URI icons for each palette category — Pitch, Rhythm, Meter,
  Tone, Ornament, Volume, Drum, Widgets, etc.)
- **Details:** None of the 13 palette tab icons have an `alt` attribute,
  `aria-label`, `aria-labelledby`, or `role="presentation"`. Screen reader
  users get no indication of which palette category each tab represents.
- **Likely file:** `js/palette.js` (palette tab/icon construction)
- **Recommended fix:**
  - If the parent `td[role="tab"]` already carries a textual label, mark the
    icon itself as decorative with `alt=""` or `role="presentation"`.
  - Otherwise, add `aria-label="<Palette name> palette"` (e.g.
    `aria-label="Pitch palette"`) to each icon so it has a discernible name.

---

### 3. Paste input button has no discernible text
- **Severity:** Critical (1 instance)
- **WCAG criterion:** 4.1.2 Name, Role, Value — A (blocks AA compliance)
- **Rule:** `input-button-name` (axe)
- **Element:** `<input onkeypress="doPaste()" type="submit" value="" tabindex="-1">`
- **Details:** A `submit`-type input with an empty `value`, no `aria-label`,
  no associated `<label>`, and `tabindex="-1"` (also unreachable via
  keyboard). Screen readers announce this as an unlabeled "button".
- **Likely file:** `js/activity.js` or related toolbar/clipboard handling
  code (search for `doPaste()`)
- **Recommended fix:**
  - Add `aria-label="Paste"` so the button has a discernible name.
  - Re-evaluate `tabindex="-1"` — if this control should be keyboard
    reachable, change to `tabindex="0"` (see Known Issue below on tab order).

---

## Cross-cutting issues (from manual review, not yet re-scanned)

These were identified during manual code review and are tracked separately
in #6608, but are noted here for completeness:

- **TAB key trap** in `js/activity.js` (~line 3812) — previously
  unconditionally called `event.preventDefault()` on `keyCode === 9`,
  trapping keyboard focus. **Fixed** — Tab is now only suppressed when
  focus is on the canvas/body; real DOM elements (toolbar buttons, widget
  inputs) receive normal Tab navigation. *(WCAG 2.1.2 No Keyboard Trap)*
- **Focus indicator suppressed on `#search` input** in
  `css/activities.css` — `outline: none` on `#search:focus` removes the
  visible focus ring for keyboard users on the search field, even though
  the global `*:focus-visible` rule provides one elsewhere.
  *(WCAG 2.4.7 Focus Visible)*

---

## Next steps

- [ ] Re-run scan after fixing the search input focus ring and palette icon
      labels; confirm the 16 issues drop accordingly.
- [ ] Audit the toolbar (play/stop/save/etc.) and modal dialogs
      (`#clear-modal-container`, `#cleardropdown`) for missing
      `aria-label`/`role`.
- [ ] Audit widget windows (`#floatingWindows`) — oscilloscope, sampler,
      pitch staircase, etc.
- [ ] Manual keyboard walkthrough: confirm Tab/Shift+Tab order across
      toolbar → palette → canvas is logical.
- [ ] Manual screen reader pass (VoiceOver) once ARIA labeling work begins.