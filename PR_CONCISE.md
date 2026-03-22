# feat(ui): Add visual state indicators for Turtle Wrap toggle button

## Problem
The Turtle Wrap toggle button lacks visual feedback for ON/OFF states. Users must rely on temporary toast messages to know the current state, creating poor UX.

## Solution
Added CSS-based visual states with professional styling:
- **OFF state**: Transparent (invisible)
- **ON state**: Blue background (#1b7ace light / #011235 dark)
- **Hover**: 10% black overlay effect (consistent with toolbar buttons)

## Changes
| File | Changes |
|------|---------|
| `css/style.css` | Added toggle button styling |
| `dist/css/style.css` | Added toggle button styling (compiled) |
| `js/toolbar.js` | Already applies `.toggle-button-active/inactive` classes |

## Testing Verified
- ✅ Light mode: Blue (#1b7ace) highlights ON state
- ✅ Dark mode: Dark blue (#011235) highlights ON state
- ✅ Hover effects: 10% overlay on both states
- ✅ Alignment: Icon centered, no width overflow
- ✅ Browsers: Chrome, Firefox, Safari tested
- ✅ Dark mode toggle: Smooth color transitions
- ✅ Accessibility: aria-pressed attribute maintained

## Technical Details
- **Type**: CSS-only enhancement (zero JS overhead)
- **Browser Support**: All modern browsers
- **Breaking Changes**: None
- **Dependencies**: None (uses existing Materialize patterns)

## Visual States
```
Light Mode:  OFF [  ] → ON [██] → Hover [██] (darker)
Dark Mode:   OFF [  ] → ON [██] → Hover [██] (darker)
```

## Checklist
- [x] Feature implemented & tested
- [x] Dark mode support added
- [x] No performance impact
- [x] Backwards compatible
- [x] Ready for merge
