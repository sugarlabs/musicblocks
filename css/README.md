# Music Blocks — CSS Design Token System
 
This directory contains the CSS stylesheets for Music Blocks, including the
unified design token system introduced in `tokens.css`.
 
---
 
## Table of Contents
 
- [Overview](#overview)
- [Token File Structure](#token-file-structure)
- [Using Tokens](#using-tokens)
- [Theme System](#theme-system)
- [Token Categories](#token-categories)
- [Adding New Tokens](#adding-new-tokens)
- [Migration Guide](#migration-guide)
- [File Reference](#file-reference)
---
 
## Overview
 
Before this token system, colours were scattered across four locations:
 
| Location | Problem |
|---|---|
| `css/activities.css` | Hardcoded hex values |
| `css/themes.css` | Partial CSS variables (`--bg`, `--fg`) |
| `js/utils/platformstyle.js` | `platformColor` JS object built at load time |
| Widget JS files | Inline `element.style.backgroundColor = platformColor.X` calls |
 
`tokens.css` replaces all of these with a **single source of truth** — a
comprehensive set of CSS custom properties that cover all three themes.
 
---
 
## Token File Structure
 
```
css/
├── tokens.css          ← Single source of truth for all design tokens
├── activities.css      ← Main app styles (imports tokens.css)
├── themes.css          ← Theme-specific overrides (imports tokens.css)
├── darkmode.css        ← Dark mode component styles
├── keyboard.css        ← Music keyboard widget styles
├── play-only-mode.css  ← Play-only mode styles
└── style.css           ← Legacy styles
```
 
---
 
## Using Tokens
 
Reference tokens anywhere in CSS using `var()`:
 
```css
/* ✅ Correct — use a token */
.toolbar {
    background-color: var(--color-toolbar-bg);
    color: var(--color-text);
    border-bottom: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
}
 
/* ❌ Wrong — never hardcode colours */
.toolbar {
    background-color: #8CC6FF;
    color: #000000;
}
```
 
To read a token value in JavaScript (e.g. for canvas rendering):
 
```javascript
// ✅ Correct — read from CSS at runtime so it respects the active theme
const bg = getComputedStyle(document.body)
    .getPropertyValue('--color-canvas-bg')
    .trim();
 
// ❌ Wrong — reads from JS object which may be stale after theme switch
const bg = platformColor.background;
```
 
---
 
## Theme System
 
Tokens are defined in three layers inside `tokens.css`:
 
| Selector | Theme | When active |
|---|---|---|
| `:root` | Light | Default — no class on `<body>` |
| `body.dark` | Dark | When `<body>` has class `dark` |
| `body.highcontrast` | High Contrast | When `<body>` has class `highcontrast` |
 
Theme switching is handled by `js/themebox.js` via `applyThemeInstantly()`,
which toggles CSS classes on `<body>` — **no page reload required**.
 
```javascript
// Theme switching in js/themebox.js
document.body.classList.add('dark');      // → activates body.dark tokens
document.body.classList.add('highcontrast'); // → activates body.highcontrast tokens
```
 
---
 
## Token Categories
 
### Colours
 
All colour tokens follow the `--color-*` naming convention:
 
```css
/* Core UI */
--color-background          /* Page/canvas background */
--color-surface             /* Card/panel background */
--color-surface-alt         /* Alternate surface (selected states) */
--color-text                /* Primary text */
--color-text-muted          /* Secondary/placeholder text */
--color-text-inverse        /* Text on coloured backgrounds */
--color-border              /* Borders and dividers */
--color-rule                /* Horizontal rule colour */
 
/* Primary / Brand */
--color-primary             /* Primary action colour */
--color-primary-hover       /* Primary hover state */
--color-primary-text        /* Text on primary backgrounds */
 
/* Header / Navigation */
--color-header              /* Navigation bar background */
--color-header-aux          /* Secondary nav colour */
--color-header-sub          /* Tertiary nav colour */
 
/* Toolbar & Palette */
--color-toolbar-bg          /* Toolbar background */
--color-palette-bg          /* Palette panel background */
--color-palette-selected    /* Selected palette item */
--color-palette-label-bg    /* Palette label background */
--color-palette-text        /* Palette label text */
 
/* Buttons */
--color-btn-confirm         /* Confirm/primary button */
--color-btn-confirm-hover   /* Confirm button hover */
--color-btn-cancel          /* Cancel/secondary button */
--color-btn-cancel-hover    /* Cancel button hover */
 
/* Focus (Accessibility) */
--color-focus-ring          /* Keyboard focus indicator colour */
```
 
### Spacing
 
```css
--spacing-1    /* 4px  */
--spacing-2    /* 8px  */
--spacing-3    /* 12px */
--spacing-4    /* 16px */
--spacing-5    /* 20px */
--spacing-6    /* 24px */
--spacing-8    /* 32px */
--spacing-10   /* 40px */
--spacing-12   /* 48px */
--spacing-16   /* 64px */
```
 
### Typography
 
```css
--font-family-base    /* sans-serif */
--font-family-mono    /* monospace */
 
--font-size-xs        /* 10px */
--font-size-sm        /* 12px */
--font-size-base      /* 14px */
--font-size-md        /* 16px */
--font-size-lg        /* 18px */
--font-size-xl        /* 24px */
--font-size-2xl       /* 32px */
 
--font-weight-normal  /* 400 */
--font-weight-bold    /* 700 */
 
--line-height-tight   /* 1.2 */
--line-height-base    /* 1.5 */
--line-height-relaxed /* 1.7 */
```
 
### Border Radius
 
```css
--radius-sm    /* 4px    */
--radius-md    /* 8px    */
--radius-lg    /* 12px   */
--radius-full  /* 9999px */
```
 
### Shadows
 
```css
--shadow-sm    /* Subtle card shadow */
--shadow-md    /* Modal/dropdown shadow */
--shadow-lg    /* Search input shadow */
```
 
### Z-Index Scale
 
```css
--z-base       /* 1     — Normal content */
--z-dropdown   /* 1000  — Dropdowns */
--z-overlay    /* 9999  — Overlays */
--z-modal      /* 10000 — Modals */
--z-toast      /* 89999 — Toast messages */
```
 
### Transitions
 
```css
--transition-fast    /* 0.15s ease — Micro-interactions */
--transition-base    /* 0.2s ease  — Standard transitions */
--transition-slow    /* 0.75s ease — Canvas/layout transitions */
```
 
---
 
## Adding New Tokens
 
1. Add the token to **all three theme blocks** in `tokens.css`:
```css
/* In :root (light theme) */
:root {
    --color-my-new-token: #value-for-light;
}
 
/* In body.dark */
body.dark {
    --color-my-new-token: #value-for-dark;
}
 
/* In body.highcontrast */
body.highcontrast {
    --color-my-new-token: #value-for-highcontrast;
}
```
 
2. Use it in CSS:
```css
.my-component {
    color: var(--color-my-new-token);
}
```
 
3. Verify WCAG AA contrast (≥ 4.5:1 for text, ≥ 3:1 for UI components)
   using [axe DevTools](https://www.deque.com/axe/) or
   [Colour Contrast Analyser](https://www.tpgi.com/color-contrast-checker/).
---
 
## Migration Guide
 
When refactoring existing code to use tokens:
 
### CSS
 
```css
/* Before */
background-color: #F9F9F9;
 
/* After */
background-color: var(--color-background);
```
 
### JavaScript (widget files)
 
```javascript
// Before — reads stale JS object
element.style.backgroundColor = platformColor.background;
 
// After — reads live CSS value, respects active theme
element.style.backgroundColor = getComputedStyle(document.body)
    .getPropertyValue('--color-background')
    .trim();
```
 
---
 
## File Reference
 
| File | Purpose |
|---|---|
| `tokens.css` | Design token definitions for all three themes |
| `activities.css` | Main application styles, imports `tokens.css` |
| `themes.css` | Theme-specific component overrides, imports `tokens.css` |
| `darkmode.css` | Dark mode specific component styles |
| `keyboard.css` | Music keyboard widget styles |
| `play-only-mode.css` | Restricted play-only interface styles |
| `style.css` | Legacy base styles |
| `svgAssetSelector.css` | SVG asset selector component styles |
| `_planet.sass` | Planet page styles (SASS source) |
| `_popdown.sass` | Popdown palette styles (SASS source) |
| `activity.sass` | Activity styles (SASS source) |
 
---
 
*For questions about the token system, open an issue or reach out to the
Sugar Labs community at [community.sugarlabs.org](https://community.sugarlabs.org).*