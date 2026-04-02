# CreateJS Usage Audit – Music Blocks

Preliminary audit of where CreateJS APIs are used across the codebase.
Created to support migration discussion in issue #5971.

CreateJS is used extensively for rendering, animation, and input handling
throughout the application.

---

## CreateJS APIs currently used

The following APIs appear in the codebase:

- createjs.Stage
- createjs.Container
- createjs.Shape
- createjs.Bitmap
- createjs.Text
- createjs.Graphics
- createjs.DOMElement
- createjs.Touch
- createjs.Tween
- createjs.Ticker
- createjs.Ease
- createjs.LoadQueue

---

## Where CreateJS is used

### Rendering / scene graph

These classes control the canvas scene structure.

APIs:
- createjs.Stage
- createjs.Container
- createjs.Shape

Files:
- js/activity.js
- js/turtles.js
- js/pastebox.js
- js/boundary.js
- js/blocks.js
- js/protoblocks.js
- js/block.js
- js/trash.js

---

### Image rendering

Used for block artwork, icons, and turtle graphics.

API:
- createjs.Bitmap

Files:
- js/activity.js
- js/turtles.js
- js/trash.js
- js/block.js
- js/planetInterface.js

---

### Text rendering

Used for block labels and other UI text.

API:
- createjs.Text

Files:
- js/activity.js
- js/block.js
- js/protoblocks.js
- js/turtle.js

---

### Animation

Animations and frame updates rely on Tween and Ticker.

APIs:
- createjs.Tween
- createjs.Ticker
- createjs.Ease

Files:
- js/artwork.js
- js/activity.js
- js/trash.js

---

### Input / interaction

CreateJS is also used for touch input and DOM integration.

APIs:
- createjs.Touch
- createjs.DOMElement

Files:
- js/activity.js

---

### Graphics utilities

Used in color utility code.

API:
- createjs.Graphics

Files:
- js/utils/munsell.js

---

## Notes

CreateJS is tightly integrated with the current rendering architecture.
It is used for:

- canvas rendering
- block graphics
- turtle graphics
- animation
- input handling

Because of this, replacing CreateJS will likely require a staged migration
rather than a single large refactor.

## How this audit was generated

The list of CreateJS APIs was collected using a repository search:

```bash
grep -roh "createjs\.[A-Za-z]*" js/ | sort | uniq

This identifies all CreateJS API references currently used in the JavaScript source files.

File locations were identified using:

grep -r "createjs" js/