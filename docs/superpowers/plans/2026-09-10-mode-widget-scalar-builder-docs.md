# Mode Widget Scalar & Builder Mode Documentation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the user-facing documentation in `Docs/guide/README.md` section 4.4 to reflect the Mode Widget's current capabilities after PRs #8059, #8240, and #8590.

**Architecture:** Rewrite section 4.4 of the English guide to document the EDO/Temperament selector, custom mode management (name, save, delete), mode pie menu for selecting built-in modes, non-EDO temperament workflow, and block export. No code changes — docs only.

**Tech Stack:** Markdown documentation, PNG screenshots

**Spec:** PRs [#8059](https://github.com/sugarlabs/musicblocks/pull/8059), [#8240](https://github.com/sugarlabs/musicblocks/pull/8240), [#8590](https://github.com/sugarlabs/musicblocks/pull/8590)

## Global Constraints

- Documentation must match existing style in `Docs/guide/README.md` (markdown, `####`/`###` headings, `*italics*` for block/widget names, backticks for code values)
- Do not modify translated guides (guide-es, guide-ja, guide-zhCN, guide-pt) — those are separate translation tasks
- Do not modify source code
- Keep section anchor `#modes` intact for cross-references

## Screenshot Assets

New screenshots saved in `Docs/guide/`:

| File | Description |
|------|-------------|
| `mode_scalar_overview.png` | Widget overview — full new toolbar, C Major mode, pie wheel with 12 slices |
| `mode_scalar_edo_dropdown.png` | EDO/Temperament dropdown expanded, showing all options |
| `mode_scalar_pie_menu.png` | Mode pie menu open — two-ring selection with mode categories |
| `mode_scalar_21edo.png` | Widget with 21-EDO selected, wheel redrawn with 21 slices |

Existing SVGs (`mode1.svg`–`mode6.svg`) are kept for backward compatibility but replaced with new PNGs in the guide where appropriate.

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `Docs/guide/README.md:1988-2077` | Rewrite section 4.4 "Musical Modes" |

---

### Task 1: Update the toolbar controls description

**Files:**
- Modify: `Docs/guide/README.md:2029-2047`

The current toolbar description lists old buttons (Play, Save, Rotate CCW, Rotate CW, Invert, Undo, Close). The actual widget now has the layout shown in `mode_scalar_overview.png`.

- [ ] **Step 1: Replace the toolbar description**

Replace lines 2029–2047 with the updated toolbar listing. The new description should cover (left column top-to-bottom, then bottom row left-to-right):

Left column:
1. *Play* — plays a scale using the current mode
2. *Mode menu* (grid/pie-chart icon) — opens a pie menu to select from built-in modes grouped by number of notes (5-note, 7-note, 12-note, and custom)
3. *Rotate counter-clockwise* — rotates the mode counter-clockwise
4. *Rotate clockwise* — rotates the mode clockwise
5. *Invert* — inverts the mode
6. *Undo* — restores the mode to the previous version

Bottom row:
7. *Mode menu button* (hamburger icon) — opens the mode selection pie menu
8. *Save* — saves the current mode as a custom mode and exports Action + Define Mode blocks to the workspace
9. *Name field* — text input to name a custom mode before saving
10. *Delete* — removes the currently loaded custom mode from saved modes

The *EDO/Temperament* dropdown is accessible from the mode menu overlay.

Use the existing formatting style: `*Name*`, which will ...; semicolons between items, "and" before the last.

- [ ] **Step 2: Add the overview screenshot**

Insert `![widget](./mode_scalar_overview.png "mode widget overview")` after the toolbar description paragraph, replacing or supplementing the old `mode2.svg` reference.

- [ ] **Step 3: Verify formatting**

Run: `grep -n "Play\|Mode menu\|EDO\|Delete\|Save\|mode_scalar" Docs/guide/README.md`
Expected: Lines 2029+ showing the new toolbar items and new screenshot reference.

---

### Task 2: Add EDO/Temperament documentation

**Files:**
- Modify: `Docs/guide/README.md:2048-2052` (insert after the new toolbar description + screenshot, before the note-clicking paragraph)

The current docs say nothing about EDO selection or non-EDO temperaments. Users need to understand that the pie wheel redraws when they change EDO, and that non-EDO temperaments (JI, Pythagorean, meantone) produce different frequency ratios.

- [ ] **Step 1: Insert EDO/Temperament paragraph**

After the toolbar description and screenshot, before "You can also click on individual notes...", insert a new paragraph explaining:

- The *EDO/Temperament* dropdown controls how many divisions the octave is split into
- Default is `12-EDO` (standard Western tuning)
- Selecting a different EDO (`5`, `17`, `19`, `31`) redraws the pie wheel with that many slices; the note labels update accordingly (see `mode_scalar_21edo.png` for an example with 21-EDO)
- Non-EDO temperaments (*5-limit Just Intonation*, *Pythagorean Tuning*, *1/3 Comma Meantone*, *1/4 Comma Meantone*) use ratio-based tuning; the pie wheel shows the closest scale degrees
- State is cached per-EDO, so switching back restores your previous notes
- When playing under non-EDO temperaments, frequencies are computed from the temperament's ratios rather than equal-temperament formulas

Use backticks for EDO values and `*italics*` for temperament names.

- [ ] **Step 2: Add the EDO dropdown screenshot**

Insert `![widget](./mode_scalar_edo_dropdown.png "EDO/Temperament dropdown")` inside or after the new paragraph.

- [ ] **Step 3: Verify the paragraph appears in the right place**

Run: `grep -n "EDO/Temperament\|non-EDO\|ratio-based\|mode_scalar_edo" Docs/guide/README.md`
Expected: New lines after the toolbar description.

---

### Task 3: Add mode pie menu documentation

**Files:**
- Modify: `Docs/guide/README.md` (insert after the EDO/Temperament section, before the note-clicking paragraph)

The mode pie menu is a key new feature — a two-ring pie menu that groups modes by note count (5-note, 7-note, 12-note, custom). It has no documentation.

- [ ] **Step 1: Insert mode pie menu paragraph**

After the EDO/Temperament section, before "You can also click on individual notes to activate or deactivate them.", insert:

- Click the *Mode menu* button (hamburger icon at bottom left) to open the mode selection pie menu
- The inner ring shows mode categories by note count: `5`, `6`, `7`, `7a`, `7b`, `8`, `12`, and `custom` (saved modes)
- The outer ring shows the modes within the selected category, with names like *major*, *minor*, *Dorian*, etc.
- Clicking a mode applies it to the wheel instantly and plays the scale so you can hear it
- Saved custom modes appear in the outer ring under the `custom` category

- [ ] **Step 2: Add the pie menu screenshot**

Insert `![widget](./mode_scalar_pie_menu.png "mode pie menu")` inside or after the new paragraph.

- [ ] **Step 3: Verify**

Run: `grep -n "Mode menu\|pie menu\|inner ring\|outer ring\|mode_scalar_pie" Docs/guide/README.md`
Expected: New paragraph with pie menu description.

---

### Task 4: Add custom mode save/export documentation

**Files:**
- Modify: `Docs/guide/README.md:2052` (insert after the note-clicking paragraph, before the Dorian example)

The current docs say "Save will save the current mode as the Custom mode and save a stack of Pitch blocks". This is outdated — Save now exports Action + Define Mode blocks, not just Pitch blocks. Also missing: naming custom modes, the Delete button, and the saved modes list.

- [ ] **Step 1: Insert custom mode management paragraph**

After "You can also click on individual notes to activate or deactivate them." and before the Dorian rotation example, insert:

- To save a custom mode, type a name in the *Name* field, adjust the notes on the wheel, then click *Save*
- Saving exports two blocks to the workspace: an *Action* block containing the mode pattern and a *Define Mode* block that registers it
- Saved custom modes appear in the mode pie menu under the `custom` group in the inner ring
- To delete a saved custom mode, load it (via the pie menu) and click *Delete*
- The mode inside the *Custom mode* block is updated whenever the mode is changed inside the widget

- [ ] **Step 2: Verify placement**

Run: `grep -n "Action.*block\|Define Mode\|Name.*field\|Delete\|custom.*group" Docs/guide/README.md`
Expected: New paragraph between note-clicking and Dorian example.

---

### Task 5: Update the Save/export paragraph

**Files:**
- Modify: `Docs/guide/README.md:2072-2076` (the phrase maker paragraph at the bottom of section 4.4)

The current paragraph says "The *Save* button exports a stack of blocks representing the mode that can be used inside the *Phrase maker* block." This is outdated — Save now exports Action + Define Mode blocks.

- [ ] **Step 1: Update the phrase maker paragraph**

Replace lines 2072–2076 with text explaining that:
- *Save* creates an *Action* block (with the mode name) and a *Define Mode* block on the workspace
- The *Action* block contains the mode pattern and can be used with the *Phrase Maker* block or any pitch stack
- The *Define Mode* block registers the custom mode so it can be used with the *Set Key* block

Keep the existing `![widget](./mode6.svg ...)` image reference as it still shows the block export structure.

- [ ] **Step 2: Verify**

Run: `grep -n "Action.*block\|Define Mode\|Phrase maker" Docs/guide/README.md`
Expected: Updated paragraph at bottom of section 4.4.

---

### Task 6: Update the Mode length block reference

**Files:**
- Modify: `Docs/guide/README.md:371-373` (scalar step section)

The current text says "the number of scalar steps in the current mode (7 for Major and Minor modes)". This is still accurate but should note that the count varies with EDO — e.g., in 19-EDO a mode might have more scalar steps.

- [ ] **Step 1: Add EDO note**

After "the number of scalar steps in the current mode (7 for Major and Minor modes)." add:

Note that the number of scalar steps depends on the current EDO setting — modes in higher-EDO temperaments may have more steps.

- [ ] **Step 2: Verify**

Run: `grep -n "scalar steps\|EDO setting" Docs/guide/README.md`
Expected: Updated line around 371-374.

---

### Task 7: Final review

**Files:**
- Modify: `Docs/guide/README.md` (full section 4.4 review)

- [ ] **Step 1: Read the complete updated section 4.4**

Read lines 1988–2100 of `Docs/guide/README.md` and verify:
- All cross-references (`#modes`, `#327-intervals`, `#343-setting-key-and-mode`) still work
- No orphaned image references
- Consistent formatting (italics for blocks, backticks for code)
- No placeholder text ("TBD", "TODO")
- Flow reads logically: modes intro → widget launch → toolbar → overview screenshot → EDO → EDO screenshot → pie menu → pie menu screenshot → note clicking → custom mode save → examples → export
- All 4 new screenshot references (`mode_scalar_overview.png`, `mode_scalar_edo_dropdown.png`, `mode_scalar_pie_menu.png`, `mode_scalar_21edo.png`) are correctly placed

- [ ] **Step 2: Run markdown lint if available**

Run: `npx markdownlint-cli Docs/guide/README.md 2>/dev/null || echo "markdownlint not installed, skipping"`
