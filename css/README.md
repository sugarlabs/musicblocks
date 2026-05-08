# MusicBlocks Design Token System

Welcome to the newly modernized CSS design token system for MusicBlocks!

## Overview
We've migrated from a fragmented design system involving `platformColor` objects and inline styles into a cohesive, native CSS custom-property (CSS Variables) token system.

This eliminates the need for full-page reloads when changing themes, vastly improves accessibility, and creates a single source-of-truth for styling across all of MusicBlocks (including the Planet page).

## How to Use Tokens

### In CSS
Instead of hardcoding colors (e.g., `#0066ff` or `#ffffff`), use the corresponding CSS token starting with `var(--color-...)`.

**Example:**
```css
/* BAD */
.my-widget {
  background-color: #303030;
  color: #fff;
}

/* GOOD */
.my-widget {
  background-color: var(--color-background);
  color: var(--color-text);
}
```

### In JavaScript
**NEVER** assign colors via `element.style.backgroundColor = platformColor.something;`.
Instead, toggle CSS classes that define these properties.

**Example:**
```javascript
// BAD
myElement.style.backgroundColor = platformColor.selectorBackground;

// GOOD
// (In widget.js)
myElement.classList.add("widget-selected");

// (In activities.css)
.widget-selected {
  background-color: var(--color-selector-background);
}
```

## Adding New Tokens
1. Open `css/tokens.css`.
2. Add your new token underneath the `:root` pseudo-class (for the Light theme default).
3. Under the `body.dark` override, supply the dark mode equivalent for the same token name (if applicable).
4. For high-contrast specific logic, you can add overrides under `body.highcontrast`.

## Troubleshooting
- **Focus Rings:** Please ensure keyboard focus remains visible! We've removed the dangerous `*:focus { outline: none; }`. Instead, use `:focus-visible` to hide it for mouse clicks while keeping it visible for keyboard tab-navigation.
- **Missing Token Color in Canvas / JS-only context:** If you actually need a raw HEX string in JS (e.g., drawing directly on a `<canvas>`), you can dynamically retrieve the token's current value via:
  ```javascript
  getComputedStyle(document.body).getPropertyValue('--color-primary').trim();
  ```