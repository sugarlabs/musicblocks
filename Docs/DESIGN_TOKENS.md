# Design Tokens Guide

MusicBlocks uses a design token system to maintain a consistent UI across different themes (Light, Dark, High Contrast) and components.

## What are Design Tokens?

Design tokens are the visual design atoms of the design system — specifically, they are named entities that store visual design attributes natively via CSS Custom Properties (CSS variables). They replace hard-coded hex codes, pixel sizes, and font families with semantically named variables.

## How to use them

### 1. Variables available

Tokens are primarily located in `css/tokens.css` under the `:root` pseudo-class (for light mode defaults), and overwritten inside `[data-theme="dark"]` and `[data-theme="high-contrast"]` selectors.

The structure of token names generally follows:
`--[property]-[category]-[variant]`

**Common Properties:**
- Colors: `--color-*`
- Spacing: `--spacing-*`
- Typography: `--font-family-*`, `--font-size-*`, `--font-weight-*`, `--line-height-*`
- Borders: `--radius-*`, `--border-*`
- Shadows: `--shadow-*`

### 2. Best Practices

- **Never hardcode hex colors or pixel values** for UI elements if a token exists for it.
- **Use fallback values**: When using a token, it's recommended to provide a structural fallback to ensure the app doesn't break if a token is not loaded properly. 
    `color: var(--color-brand-primary, #3b82f6);`
- **Avoid tying tokens to specific components.** Prefer semantic tokens like `--color-bg-primary` over explicitly named component classes like `--color-navbar-bg`.

## Theme Switching

The `:root` tokens inherently define the Light theme default. To toggle between dark or high contrast mode, a `data-theme` attribute (or a specific body class like `.dark` or `.highcontrast`) is leveraged. The component CSS (e.g. `planetThemes.css`) simply needs to use `var(--color-...)` and it will automatically reflect the correct thematic configuration globally.
