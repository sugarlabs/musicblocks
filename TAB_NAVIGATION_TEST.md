# Tab Navigation Testing Guide

## Quick Start

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Open the app:**
   - Navigate to http://127.0.0.1:3000
   - Wait for page to fully load

3. **Start testing:**
   - Press Tab and watch focus move through buttons
   - Each button should have a visible 2px focus ring

---

## Expected Tab Order (Main Toolbar)

When you press Tab repeatedly, focus should move in this sequence:

```
1. Play (▶ play_circle_filled)
   ↓ Tab
2. Stop (⏹ stop)
   ↓ Tab
3. Record (with dropdown arrow)
   ↓ Tab
4. Fullscreen (⛶)
   ↓ Tab
5. New File (📝 note_add)
   ↓ Tab
6. Load (📁 folder)
   ↓ Tab
7. Save (💾 save_alt)
   ↓ Tab
8. Planet (🌐 public)
   ↓ Tab
9. Menu (≡ menu)
   ↓ Tab
10. Help (❓ help)
    ↓ Tab
11. (Then moves to other page elements)
```

---

## Test Checklist

### ✅ Focus Ring Visibility

- [ ] Light Theme: Blue 2px outline visible
- [ ] Dark Theme: Light blue 2px outline visible
- [ ] High Contrast: Yellow 3px outline visible
- [ ] Focus ring has 2px offset from element
- [ ] Focus ring is never hidden

### ✅ Tab Navigation (Main Toolbar)

- [ ] Press Tab → Play button gets focus (blue ring)
- [ ] Press Tab → Stop button gets focus
- [ ] Press Tab → Record button gets focus
- [ ] Press Tab → Fullscreen button gets focus
- [ ] Press Tab → New File button gets focus
- [ ] Press Tab → Load button gets focus
- [ ] Press Tab → Save button gets focus
- [ ] Press Tab → Planet button gets focus
- [ ] Press Tab → Menu button gets focus
- [ ] Press Tab → Help button gets focus

### ✅ Reverse Tab Navigation

- [ ] Press Shift+Tab at Help → moves back to Menu
- [ ] Press Shift+Tab at Menu → moves back to Planet
- [ ] Continue backward through all buttons
- [ ] Reaches Play button and loops

### ✅ Keyboard Activation

- [ ] Focus Play button: Press Enter → program runs
- [ ] Focus Stop button: Press Enter → stops program
- [ ] Focus Record button: Press Enter → opens dropdown
- [ ] Focus Theme button: Press Space → opens theme menu
- [ ] In dropdown: Press ArrowDown/Up to navigate items
- [ ] In dropdown: Press Enter to select
- [ ] In dropdown: Press Escape to close

### ✅ Hidden Elements Excluded

- [ ] SaveButtonAdvanced (hidden by default) is **NOT** in tab order
- [ ] PlanetIconDisabled (hidden by default) is **NOT** in tab order
- [ ] Install button (hidden by default) is **NOT** in tab order

### ✅ Theme Integration

- [ ] Switch to Dark theme → focus ring is light blue
- [ ] Switch to High Contrast → focus ring is yellow
- [ ] Switch back to Light → focus ring is blue
- [ ] Focus ring color updates instantly (no page reload)

### ✅ Dropdown Behavior

1. **Open Dropdown:**
   - Tab to dropdown trigger button
   - Press Enter or Space
   - Dropdown opens

2. **Navigate Inside Dropdown:**
   - Press ArrowDown to next item
   - Press ArrowUp to previous item
   - Press Enter to select item
   - Menu closes and focus returns to trigger button

3. **Close Dropdown:**
   - Press Escape
   - Focus returns to trigger button
   - Dropdown closes

### ✅ Focus Persistence

- [ ] Tab through several buttons
- [ ] Click somewhere on canvas
- [ ] Press Tab again → focus resumes from beginning (Play button)
- [ ] Focus never "disappears" or gets lost

---

## Visual Feedback Features

### Focus Ring (All Themes)
- **2px solid outline** around focused element
- **2px offset** from element edge
- **Color-coded by theme:**
  - Light: #1976d2 (blue)
  - Dark: #90caf9 (light blue)
  - High Contrast: #ffff00 (yellow)

### Background Highlight (Toolbar Buttons)
- When Tab is pressed, focused button background slightly highlights
- Light theme: Subtle blue tint
- Dark theme: Subtle light blue tint
- High Contrast: Subtle yellow tint

### Keyboard Navigation Indicator
- Body gets `keyboard-nav-active` class during Tab navigation
- Removed when mouse is used
- Provides consistent visual feedback

---

## Commands for Testing Each Theme

### Test in Light Theme
```
1. Open app
2. Press Tab repeatedly
3. Observe blue focus ring
4. Press Enter on buttons to test activation
```

### Test in Dark Theme
```
1. Tab to Theme button
2. Press Enter/Space to open dropdown
3. Press ArrowDown → Dark
4. Press Enter
5. Observe light blue focus ring
6. Continue Tab tests
```

### Test in High Contrast Theme
```
1. Tab to Theme button
2. Press Enter/Space
3. Press ArrowDown twice → High Contrast
4. Press Enter
5. Observe yellow 3px focus ring
6. Continue Tab tests
```

---

## Troubleshooting

### Issue: Tab doesn't move to next button
**Solution:**
- Refresh page (F5)
- Clear browser cache (Ctrl+Shift+Delete)
- Check DevTools console for errors (F12)

### Issue: Focus ring not visible
**Solution:**
- Check browser zoom (Ctrl+0 to reset)
- Try different theme (Theme button)
- Check if browser DevTools is interfering
- Try a different browser (Chrome, Firefox, Safari)

### Issue: Hidden buttons in tab order
**Solution:**
- This should be fixed - verify in DevTools:
  ```
  1. F12 → Elements tab
  2. Find #saveButtonAdvanced
  3. Check: should have tabindex="-1"
  4. Check: parent should have style="display: none"
  ```

### Issue: Dropdown not opening with keyboard
**Solution:**
- Make sure you're focused on the button (see focus ring)
- Press Enter or Space (not just click)
- Check that `aria-haspopup="menu"` is present in HTML

---

## Browser Support

| Browser | Support | Tested |
|---------|---------|--------|
| Chrome 90+ | ✅ Full | Yes |
| Firefox 88+ | ✅ Full | Yes |
| Safari 14+ | ✅ Full | Yes |
| Edge 90+ | ✅ Full | Yes |
| Mobile Chrome | ✅ Full | - |
| Mobile Firefox | ✅ Full | - |

---

## Video Recording Tips

**For Demo Video:**

1. **Show Tab Order:**
   - Press Tab slowly (2-3 seconds between presses)
   - Let viewers see focus ring move
   - Narrate: "Tab moves focus to next button"

2. **Show Theme Changes:**
   - Open Theme dropdown
   - Change to Dark theme
   - Show focus ring color changes
   - Narrate: "Focus ring automatically updates when theme changes"

3. **Show Dropdown Navigation:**
   - Tab to a dropdown button
   - Press Enter
   - Use Arrow keys to navigate
   - Press Enter to select
   - Narrate: "All dropdown interactions work with keyboard"

4. **Show Reverse Navigation:**
   - Press Shift+Tab several times
   - Narrate: "Shift+Tab moves backward through buttons"

---

## Expected Files Modified

- ✅ `index.html` - Tab order fixed, aria-labels added
- ✅ `js/utils/accessibility.js` - Tab tracking and focus management
- ✅ `css/activities.css` - Enhanced focus ring styles
- ✅ `js/activity.js` - Accessibility helper initialization
- ✅ `js/themebox.js` - Focus color updates on theme change
- ✅ `js/widgets/widgetWindows.js` - Tab focus management
- ✅ `js/loader.js` - Accessibility module loading

---

## Debug Commands

```bash
# Check for console errors
# Open DevTools (F12) → Console tab
# Run the app and check for red errors

# Verify accessibility attributes
# DevTools → Elements tab → find any button
# Should have: tabindex, role, aria-label

# Check CSS is applied
# DevTools → Styles tab (when button focused)
# Should see: outline: 2px, outline-offset: 2px
```

---

**Ready to test?** Start with `npm run dev` and press Tab! 🚀
