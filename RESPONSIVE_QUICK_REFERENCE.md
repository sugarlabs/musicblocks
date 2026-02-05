# Widget Windows Responsive Design - Quick Reference

## 🎯 Quick Facts

- **Main Breakpoint**: 600px (mobile vs desktop)
- **Minimum Touch Target**: 44px × 44px (WCAG 2.5.5)
- **Fluid Scaling**: Uses `clamp()` for smooth responsive behavior
- **CSS Variables**: 13 design tokens in `:root`
- **Browser Support**: Modern browsers (Chrome 79+, Firefox 75+, Safari 13.1+)

---

## 📱 Responsive Breakpoints

| Breakpoint | Description | Behavior |
|------------|-------------|----------|
| `> 600px` | Desktop & Tablet Portrait | Floating windows with borders |
| `≤ 600px` | Mobile Portrait | Full-screen overlay |
| `601px - 1024px (landscape)` | Tablet Landscape | Desktop mode with enhanced touch targets |
| `≤ 360px` | Ultra-small devices | Tighter spacing, smaller fonts |

---

## 🎨 CSS Custom Properties

### Core Variables

```css
/* Copy these to customize */
:root {
  /* Touch Targets */
  --touch-target-min: 44px;
  
  /* Mobile Sizing (fluid with clamp) */
  --topbar-height-mobile: clamp(48px, 12vw, 56px);
  --button-size-mobile: clamp(3rem, 10vw, 3.5rem);
  --title-font-size-mobile: clamp(1.1em, 3.5vw, 1.5em);
  --button-padding-mobile: clamp(0.5rem, 2vw, 0.9375rem);
  --widget-padding-mobile: clamp(5px, 2vw, 10px);
  
  /* Colors */
  --topbar-bg-mobile: #2196f3;
  --button-bg-desktop: #666;
  --toolbar-item-bg: #8cc6ff;
}
```

### How to Customize

```css
/* Override in your theme CSS */
:root {
  --topbar-bg-mobile: #your-color;
  --touch-target-min: 48px; /* Larger touch targets */
}
```

---

## 🔧 Common Customizations

### Change Mobile Top Bar Color

```css
:root {
  --topbar-bg-mobile: #673AB7; /* Purple */
}
```

### Increase Touch Target Size

```css
:root {
  --touch-target-min: 48px; /* Default is 44px */
}
```

### Adjust Mobile Font Sizes

```css
:root {
  /* min, preferred, max */
  --title-font-size-mobile: clamp(1.2em, 4vw, 1.8em);
}
```

### Customize Mobile Padding

```css
:root {
  --widget-padding-mobile: clamp(10px, 3vw, 20px);
}
```

---

## 📐 clamp() Function Guide

The `clamp()` function enables fluid responsive sizing:

```css
clamp(MIN, PREFERRED, MAX)
```

**Example:**
```css
font-size: clamp(1.1em, 3.5vw, 1.5em);
```

- **Minimum**: 1.1em (never smaller)
- **Preferred**: 3.5vw (scales with viewport)
- **Maximum**: 1.5em (never larger)

**Common Use Cases:**

```css
/* Padding: 8px to 15px based on viewport */
padding: clamp(0.5rem, 2vw, 0.9375rem);

/* Width: 48px to 56px based on viewport */
width: clamp(3rem, 10vw, 3.5rem);

/* Height: 48px to 56px based on viewport */
height: clamp(48px, 12vw, 56px);
```

---

## 🖥️ Device Testing Quick Command

### Chrome DevTools

```bash
# Open with device emulation
# Mac: Cmd+Option+I, then Cmd+Shift+M
# Win: Ctrl+Shift+I, then Ctrl+Shift+M
```

### Test These Sizes

```
Mobile:
- 375px (iPhone SE)
- 393px (Pixel 5)
- 360px (Galaxy S20)
- 280px (Galaxy Fold)

Tablet:
- 768px × 1024px (iPad portrait)
- 1024px × 768px (iPad landscape)
```

---

## ✅ Touch Target Checklist

When adding new interactive elements:

```css
/* Always include minimum touch targets */
.my-button {
  min-width: var(--touch-target-min);
  min-height: var(--touch-target-min);
}

/* Or use the explicit value */
.my-button {
  min-width: 44px;
  min-height: 44px;
}
```

**WCAG 2.5.5 Requirements:**
- ✅ Minimum 44px × 44px for all touch targets
- ✅ Adequate spacing between adjacent targets
- ✅ Visual feedback on tap/click

---

## 🎯 Accessibility Quick Checks

### Focus Indicators

```css
/* All interactive elements should have focus styles */
.my-element:focus-visible {
  outline: 2px solid #2196f3;
  outline-offset: 2px;
}
```

### Reduced Motion

```css
/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  .my-animated-element {
    transition: none;
    animation: none;
  }
}
```

### Smooth Scrolling (iOS)

```css
/* For scrollable containers on mobile */
.my-scrollable-container {
  -webkit-overflow-scrolling: touch;
  overflow-y: auto;
}
```

---

## 🐛 Common Issues & Fixes

### Issue: Touch targets too small

```css
/* ❌ Wrong */
.button {
  width: 32px;
  height: 32px;
}

/* ✅ Correct */
.button {
  width: 32px;
  height: 32px;
  min-width: var(--touch-target-min);
  min-height: var(--touch-target-min);
}
```

### Issue: Text too large/small on some devices

```css
/* ❌ Wrong */
.title {
  font-size: 1.5em; /* Fixed */
}

/* ✅ Correct */
.title {
  font-size: clamp(1.1em, 3.5vw, 1.5em); /* Fluid */
}
```

### Issue: Horizontal overflow on mobile

```css
/* ❌ Wrong */
.container {
  width: 500px; /* Fixed width */
}

/* ✅ Correct */
.container {
  width: 100%;
  max-width: 500px;
  /* OR */
  width: min(500px, 100vw);
}
```

### Issue: Toolbar items not scrollable on mobile

```css
/* ✅ Ensure toolbar scrolls horizontally */
.wfbToolbar {
  display: flex;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.wfbToolbar > * {
  flex-shrink: 0; /* Prevent items from shrinking */
}
```

---

## 📊 Breakpoint Testing Checklist

Use this when testing responsive changes:

```markdown
Desktop (> 600px):
- [ ] Floating windows with borders
- [ ] Border radius visible
- [ ] Small buttons (21px)
- [ ] Rollup/minimize buttons visible

Mobile (≤ 600px):
- [ ] Full-screen overlay (100vw × 100vh)
- [ ] Blue top bar
- [ ] Large touch buttons (48-56px)
- [ ] Title in white
- [ ] Horizontal toolbar

Tablet Landscape (768-1024px):
- [ ] Windows max 90vw width
- [ ] Touch targets 32px minimum
- [ ] Desktop floating behavior

Ultra-small (≤ 360px):
- [ ] Text still readable
- [ ] No horizontal overflow
- [ ] Touch targets still 44px minimum
```

---

## 🚀 Performance Tips

### Do:
✅ Use CSS custom properties for theming  
✅ Use `clamp()` for fluid scaling  
✅ Minimize media query complexity  
✅ Use flexbox for layouts  
✅ Leverage CSS transitions (300ms or less)  

### Don't:
❌ Create too many breakpoints  
❌ Use JavaScript for simple responsive adjustments  
❌ Override `!important` unnecessarily  
❌ Use fixed pixel values when fluid is possible  
❌ Nest media queries too deeply  

---

## 📝 Code Snippets

### Adding a New Widget

```css
/* Your widget styles */
.myWidget {
  padding: var(--spacing-md);
  background: var(--window-bg);
}

/* Mobile adjustments */
@media (max-width: 600px) {
  .myWidget {
    padding: var(--widget-padding-mobile);
    /* Automatically responsive */
  }
}
```

### Custom Button

```css
.myButton {
  /* Desktop */
  width: 30px;
  height: 30px;
  cursor: pointer;
  transition: background-color var(--transition-default);
}

/* Mobile */
@media (max-width: 600px) {
  .myButton {
    width: auto;
    min-width: var(--touch-target-min);
    min-height: var(--touch-target-min);
    padding: 0 var(--button-padding-mobile);
  }
}

/* Accessibility */
.myButton:focus-visible {
  outline: 2px solid #2196f3;
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .myButton {
    transition: none;
  }
}
```

### Responsive Typography

```css
.heading {
  /* Fluid font size: 16px to 24px */
  font-size: clamp(1rem, 2.5vw, 1.5rem);
  
  /* Fluid letter spacing: 0.5px to 2px */
  letter-spacing: clamp(0.5px, 0.4vw, 2px);
  
  /* Fluid line height: 1.2 to 1.6 */
  line-height: clamp(1.2, 1.5, 1.6);
}
```

---

## 🔗 Related Files

- **Main CSS**: `dist/css/windows.css`
- **Testing Guide**: `RESPONSIVE_TESTING.md`
- **Improvements Doc**: `RESPONSIVE_IMPROVEMENTS.md`
- **Viewport Config**: `index.html` (meta viewport tag)

---

## 📚 Resources

- [CSS clamp() Calculator](https://clamp.font-size.app/)
- [WCAG 2.5.5 Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [MDN: clamp()](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp)
- [MDN: Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)

---

## 💡 Pro Tips

1. **Use CSS variables for ALL theme values** - easier to maintain
2. **Test on real devices**, not just emulators
3. **Start mobile-first**, then enhance for desktop
4. **Use `min()` and `max()` for simple constraints**
5. **Document your breakpoint decisions** for future developers

---

**Quick Help:**
- Need to change mobile top bar color? → Modify `--topbar-bg-mobile`
- Touch targets too small? → Increase `--touch-target-min`
- Text scaling issues? → Adjust `clamp()` values
- Layout broken on tablet? → Check tablet landscape media query

**File Location**: `/Users/sapnilbiswas/Sapnil/Web-Dev/projectsGSOC/musicblocks/dist/css/windows.css`
