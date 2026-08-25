# Proposal: Screen-Reader Accessible Programming Canvas

**Author:** Abhnish Kumar
**Related issue:** #6608
**Status:** Draft — for discussion with @walterbender / @pikurasa before any implementation begins

## Why this exists

The original ticket for #6608 lists, under "Implementation Details":

> For screen reader support of canvas-rendered blocks, implement a parallel
> hidden DOM layer (visually hidden `<div>` tree with `aria-label` and
> `role="button"`) that mirrors the block structure and receives focus
> events, forwarding interactions to the EaselJS canvas layer.

Everything else in the ticket has shipped: WCAG audit, high-contrast theme,
keyboard nav for toolbar/palette/widgets, ARIA live regions, and
aria-label/role/aria-describedby on toolbar buttons, modals, and widget
windows. This is the one item that was never actually started. The
programming canvas itself — `#canvas` / `#myCanvas`, rendered via EaselJS —
is still completely invisible to screen readers today. A screen reader
user can operate every menu and widget around the canvas, but cannot
perceive or manipulate a single block on it.

This document is **not** a PR. It's a scoping proposal, because this is a
different kind of work than everything raised so far this cycle: those
were all small, single-purpose, low-risk PRs against existing UI chrome.
This is a new accessibility feature layered onto the core rendering
architecture of the app, and it deserves a real design conversation before
code, not an incremental patch.

## Update: relationship to the CreateJS migration (#6612)

Walter has confirmed the team is very likely to phase out CreateJS
altogether, replacing canvas-rendered blocks with real DOM objects
(#6612). If that migration proceeds, it removes the need for the
mirror-DOM approach described below entirely — real DOM elements just
need `role`, `aria-label`, and keyboard handling added directly, with no
parallel hidden layer to build or keep in sync.

Given this, the plan going forward is:

- **Primary path:** accessibility for canvas blocks is delivered as part
  of the CreateJS → DOM migration itself, with `role`/`aria-label`/focus
  handling built into each block's DOM representation from the start.
  A comment has been added to #6612 flagging this as a first-class
  requirement of that migration, not something to retrofit afterward.
- **Fallback path:** if the CreateJS migration is delayed, descoped, or
  doesn't happen, the phased mirror-DOM implementation below remains a
  valid, independent plan.

No implementation work should start on the mirror-DOM approach until the
direction on #6612 is clearer, to avoid building something that becomes
immediately obsolete if the migration lands first.

## What we're actually dealing with

- `js/block.js` (5,045 lines) — the `Block` class. Each block is an
  EaselJS `container` with its own `hitArea`, and responds to
  `mouseover` / `click` / `mousedown` / `pressmove` / `pressup` /
  `touchstart` / `touchmove` / `touchend` — there is no DOM node per
  block today, only canvas-drawn shapes.
- `js/blocks.js` (7,046 lines) — the `Blocks` container: owns
  `blockList` (every block instance) and `stackList` (which blocks are
  connected into which program stacks), and the connection/disconnection
  logic (`adjustDocks`, dock matching, etc.).
- `js/activity/block-drag-controller.js` — where a completed drag
  resolves into a connection. `blockMoved()` here is already the hook
  that fires the "connected X to Y" aria-live announcement we shipped
  earlier (#8078) — this is the natural place to also keep a mirror-DOM
  tree in sync going forward.

There is currently no DOM representation of a block at all — not even a
hidden one. This is a from-scratch build, not an extension of an existing
pattern (unlike everything else in this project so far).

## Proposed approach

Build a parallel, visually-hidden DOM tree that mirrors the block
structure, is kept in sync with `blockList`/`stackList`, and forwards
activation back into the EaselJS layer — matching the ticket's own
description of the standard pattern for accessible canvas UIs.

### Phase 1 — Prove the pattern on one block type
Pick a single, simple block type (e.g. a plain "print" or "forward"
number-argument block) and:
- Generate one hidden, focusable `<div role="button" aria-label="...">`
  for a block of that type when it's created
- Position it off-screen (not `display:none` — needs to stay in the
  accessibility tree) rather than trying to visually track the canvas
  block's position
- Wire a `keydown` (Enter/Space) handler that forwards to the same
  code path the canvas `click` handler already uses
- No stack/connection awareness yet — this phase is purely "does a
  screen reader user perceive and activate a single block"

This phase is small enough to be a real PR and answers the riskiest
open question before we commit to the rest: does forwarding a keyboard
activation into EaselJS's existing click handling actually work cleanly,
or does it need EaselJS-side changes too?

### Phase 2 — Keep the mirror tree in sync
Hook into `blockMoved()` (`js/activity/block-drag-controller.js`) and the
equivalent removal path so the hidden DOM tree adds/removes/reorders
nodes whenever `blockList`/`stackList` change. This is where most of the
real complexity lives — reflecting "which blocks are connected to which,
in what order" in a way that's navigable (arrow keys between siblings,
Enter to descend into a nested block, etc.) rather than just a flat
unordered list of every block on the canvas.

### Phase 3 — Extend coverage across block categories
Different block categories have different interaction models (a number
block with an editable value vs. a flow-control block vs. a block that
opens a widget). This phase is likely 1–2 PRs on its own, split by
block category, each adding the right `role`/`aria-label` shape for
that category's interaction model.

### Phase 4 — Palette integration
The block palette (where blocks are dragged from) is the same
EaselJS-rendered, currently-invisible-to-screen-readers situation. Same
pattern, separate PR, since palette blocks aren't yet placed/connected.

### Testing
Given the size of this, a screen reader pass (NVDA or VoiceOver) against
each phase as it lands makes more sense than saving it all for the very
end — this is also the one acceptance criterion from the ticket
("changes are tested with at least one screen reader") that hasn't been
exercised on anything shipped yet, and doing it here first will surface
process/tooling issues before it matters on smaller changes too.

## Open questions for Walter / Devin

1. Is a flat, non-positional hidden DOM tree (screen reader reads blocks
   in creation/connection order, not spatial position) an acceptable
   first cut, or is spatial navigation (arrow keys following the visual
   layout) a hard requirement from the start?
2. Should this land behind a feature flag / opt-in setting while it's
   being built out across categories, given the scope, or is incremental
   same-branch rollout fine like everything else this cycle?
3. Devin's touch/trackpad prerequisite work (still blocked on real-device
   testing) and this are both about making canvas interaction more
   accessible from different angles — should they be sequenced, or can
   they proceed independently?
4. Does this warrant its own tracking issue split off from #6608, given
   its size relative to everything else done under that issue so far?

## What this is not

This proposal does not include any code changes. Nothing in `block.js`,
`blocks.js`, or `block-drag-controller.js` has been modified. The intent
is to agree on Phase 1's scope before writing anything.