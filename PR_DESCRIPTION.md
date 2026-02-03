# Performance Optimizations for Block Operations

## Description
This PR addresses several performance bottlenecks identified in the codebase, focusing on reducing unnecessary DOM operations and improving algorithmic efficiency during block manipulation and UI interactions.

## Changes

### 1. Debounced Resize Handler ([js/piemenus.js](js/piemenus.js))
- **Issue**: The `setWheelSize` function was firing 30-60 times per second during window resize events, causing excessive DOM style recalculations.
- **Solution**: Added a 150ms debounce wrapper (`debouncedSetWheelSize`) that batches resize events into a single execution.

### 2. O(1) Set Lookups Instead of O(n) Array.includes() ([js/blocks.js](js/blocks.js))
- **Issue**: `findUniqueActionName`, `findUniqueCustomName`, and `findUniqueTemperamentName` used `Array.push()` and `Array.includes()` for name collision detection, resulting in O(n) lookup times that degraded with large projects.
- **Solution**: Changed to `Set.add()` and `Set.has()` for O(1) constant-time lookups.

### 3. Batched DOM Cache Updates ([js/blocks.js](js/blocks.js))
- **Issue**: `renameBoxes`, `renameStoreinBoxes`, `renameStorein2Boxes`, and `renameNamedboxes` called `updateCache()` synchronously inside loops, causing multiple layout thrashes (forced reflows).
- **Solution**: Collect all blocks that need updates, then batch them using `requestAnimationFrame()` to consolidate into a single repaint cycle.

## Performance Impact
- **Resize handler**: Reduces function calls from ~60/sec to 1 call per resize gesture
- **Name lookups**: O(n²) → O(n) for unique name generation with many blocks
- **Batch updates**: Reduces forced reflows from N to 1 when renaming affects multiple blocks

## Testing
- **Browser Testing**: Verified application loads and functions correctly at http://127.0.0.1:3000
- **Automated Tests**: All 89 test suites passed (2327 tests total)
- **Linting**: ESLint passed with no errors
- **Error Check**: No compile or lint errors in modified files

## Files Changed
- [js/piemenus.js](js/piemenus.js) - Debounced resize handler
- [js/blocks.js](js/blocks.js) - Set-based lookups and batched DOM updates
