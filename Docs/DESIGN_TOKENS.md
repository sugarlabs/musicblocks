# Design Tokens Guide

MusicBlocks uses a design token system to maintain a consistent UI across different themes (Light, Dark, High Contrast) and components.

## What are Design Tokens?

Design tokens are the visual design atoms of the design system — specifically, they are named entities that store visual design attributes natively via CSS Custom Properties (CSS variables). They replace hard-coded hex codes, pixel sizes, and font families with semantically named variables.

## How to use them

### 1. Variables available

Tokens are primarily located in `css/tokens.css` under the `:root` pseudo-class (for light mode defaults), and overridden inside `body.dark` and `body.highcontrast` class selectors.

The structure of token names generally follows:
`--[property]-[category]-[variant]`

**Common Properties:**

- Colors: `--color-*`
- Spacing: `--spacing-*`
- Typography: `--font-family-*`, `--font-size-*`, `--font-weight-*`, `--line-height-*`
- Borders: `--radius-*`, `--border-*`
- Shadows: `--shadow-*`

**Key tokens (light-theme defaults):**

| Token | Default | Purpose |
|-------|---------|--------|
| `--color-bg-primary` | `#ffffff` | Main background |
| `--color-bg-secondary` | `#f3f4f6` | Secondary / elevated surfaces |
| `--color-bg-tertiary` | `#e5e7eb` | Tertiary background |
| `--color-text-primary` | `#1f2937` | Primary text |
| `--color-text-secondary` | `#4b5563` | Secondary text |
| `--color-text-inverse` | `#ffffff` | Text on dark backgrounds |
| `--color-border-primary` | `#d1d5db` | Primary borders |
| `--color-brand-primary` | `#3b82f6` | Brand accent colour |
| `--color-brand-secondary` | `#8b5cf6` | Secondary accent colour |
| `--color-success` | `#10b981` | Success state |
| `--color-error` | `#ef4444` | Error state |
| `--color-warning` | `#f59e0b` | Warning state |
| `--spacing-md` | `1rem` | Standard spacing (16 px) |
| `--radius-md` | `0.375rem` | Standard border radius |
| `--shadow-md` | *(see file)* | Medium elevation shadow |
| `--shadow-focus` | *(see file)* | Focus ring shadow |

> See `css/tokens.css` for the complete list, including `body.dark` and `body.highcontrast` overrides.

### 2. Best Practices

- **Never hardcode hex colors or pixel values** for UI elements if a token exists for it.
- **Use fallback values**: When using a token, it's recommended to provide a structural fallback to ensure the app doesn't break if a token is not loaded properly.
  `color: var(--color-brand-primary, #3b82f6);`
- **Avoid tying tokens to specific components.** Prefer semantic tokens like `--color-bg-primary` over explicitly named component classes like `--color-navbar-bg`.

## Theme Switching

The `:root` tokens inherently define the Light theme default. To toggle between dark or high contrast mode, toggle `body.dark` or `body.highcontrast` on the `<body>` element. The component CSS (e.g. `planetThemes.css`) simply needs to use `var(--color-...)` and it will automatically reflect the correct thematic configuration globally.
