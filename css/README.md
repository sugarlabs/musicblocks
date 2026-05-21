# MusicBlocks CSS Token System

## Overview
`css/tokens.css` is the single source of truth for all design decisions
in MusicBlocks. It replaces the `platformColor` JavaScript object with
CSS custom properties that cascade automatically across all themes.

## Token structure

| Category | Prefix | Example |
|---|---|---|
| Colours | `--color-` | `--color-primary` |
| Spacing | `--space-` | `--space-4` |
| Typography | `--font-` | `--font-size-md` |
| Border radius | `--radius-` | `--radius-md` |
| Shadows | `--shadow-` | `--shadow-md` |
| Z-index | `--z-` | `--z-modal` |

## Theme system

Light theme values are defined on `:root`.
Dark theme overrides live under `body.dark`.
High-contrast overrides live under `body.highcontrast`.

```css
:root {
    --color-primary: #0066ff;
}

body.dark {
    --color-primary: #4da6ff;
}

body.highcontrast {
    --color-primary: #00ffff;
}
```

## How to use a token in CSS

```css
.my-component {
    background-color: var(--color-surface);
    padding: var(--space-4);
    border-radius: var(--radius-md);
}
```

## How to read a token value in JavaScript

Never hardcode colour values in JS. Use the bridge utility instead:

```js
function getCSSToken(tokenName) {
    return getComputedStyle(document.body)
        .getPropertyValue(tokenName)
        .trim();
}

const primary = getCSSToken('--color-primary');
```

This always returns the correct value for the active theme.

## How to add a new token

1. Open `css/tokens.css`
2. Add your token under `:root` with a light-theme value
3. Add dark override under `body.dark` if the value differs
4. Add high-contrast override under `body.highcontrast` if needed
5. Reference it via `var(--your-token-name)` in CSS

```css
:root {
    --color-my-new-token: #abc123;
}

body.dark {
    --color-my-new-token: #321cba;
}
```

## Naming conventions

- Use semantic names not visual ones — `--color-surface` not `--color-white`
- Use kebab-case always — `--color-widget-bg` not `--colorWidgetBg`
- Prefix by category — `--color-`, `--space-`, `--font-`, `--radius-`
- Block-specific tokens use the block name — `--color-block-pitch`

## Migrating an inline JS style to tokens

Before:
```js
element.style.backgroundColor = platformColor.widgetBackground;
```

After:
```js
element.classList.add('widget-bg');
```

```css
.widget-bg {
    background-color: var(--color-widget-bg);
}
```

## Files that consume tokens

| File | Status |
|---|---|
| `css/activities.css` | Migrated |
| `css/themes.css` | Pending |
| `dist/css/windows.css` | Pending |
| `planet/css/planetThemes.css` | Pending |

## Materialize CSS conflicts

`lib/materialize-iso.css` is not being replaced. Where Materialize
styles conflict with tokens, use a scoped override with higher
specificity. Flag persistent conflicts with a `TODO(tokens):` comment
for future resolution.