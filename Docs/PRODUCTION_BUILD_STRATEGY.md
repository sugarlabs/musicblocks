# Production Build Optimization Strategy: Architecture & Performance

## Why
Music Blocks currently serves mostly unbundled, raw JavaScript and asset files. 
While this works in development, it introduces limitations for:
- Production performance (high HTTP request count)
- Predictable offline caching
- Service worker reliability
- Long-term maintainability alongside AMD-based loading

This document explores a **lightweight investigation** of production build optimizations without introducing a full migration or breaking existing architecture.

## Current Behavior
- JavaScript and assets are largely served as individual files.
- No formal production bundling or minification strategy exists.
- Service worker caching must account for many independent assets (hundreds of individual JS files).
- RequireJS / AMD loading is the primary module system, which constrains conventional bundling approaches that expect ES modules or CommonJS.

## Analysis: Current State & Offline Impact

### Baseline Metrics (as of Feb 2026)
To provide a comparison reference for future optimizations:
- **Total JavaScript Request Count:** ~248 files (209 Application, 39 Libraries).
- **Total JavaScript Size (Uncompressed):** ~12.94 MB.
- **Application Logic (`js/`):** 209 files, 6.42 MB.
- **Libraries (`lib/`):** 39 files, 6.52 MB.
- **Loading Model:** Sequential AMD loading, resulting in a deep waterfall of requests.

### Service Worker & Offline Caching
The current `sw.js` implementation follows a **stale-while-revalidate** pattern with significant constraints for offline reliability:
1. **Limited Pre-caching:** Only `index.html` is explicitly pre-cached. All other assets are cached dynamically upon first request.
2. **Fragmentation:** Caching 200+ individual JS files increases the risk of partial cache states (where some files are cached and others are not), leading to runtime errors in offline mode.
3. **Implicit Dependencies:** If the service worker fails to intercept a single AMD dependency (e.g., due to a network blip), the entire module fails to load.
4. **Cache Invalidation:** Without content hashing, ensuring users receive the latest version of a file depends on the browser's fetch behavior and the SW's revalidation logic, which can be inconsistent.

### Proposed Strategy (Groundwork)
This strategy focuses on low-risk, future-oriented thinking:

### 1. Selective Minification
Before full bundling, we can investigate minifying individual files during a "build" step.
- Reduces payload size without changing the loading model.
- Keep source maps for easier production debugging.

### 2. Asset Grouping (Low-Risk Experiment)
Instead of bundling everything into one file (which breaks RequireJS's dynamic loading), we can group "core" modules that are always loaded together.
- Example: `js/utils/utils.js`, `js/turtles.js`, and basic library wrappers.

### 3. Hashing/Versioning
Introduce a simple hashing mechanism for production assets to ensure service workers can reliably identify when an asset has changed.

### Running the Asset Analysis Script

From the repository root:

```bash
node scripts/analyze-production-assets.js
```

This script recursively scans the `js/` and `lib/` directories to report:
- Total JavaScript file count
- Aggregate size
- Estimated minification savings

No build step or configuration is required.

## Scope & Constraints
- **Documentation first:** This document serves as the primary outcome of this phase.
- **No replacement of RequireJS / AMD:** The current module system is deeply integrated and stable.
- **No build system overhaul:** Use existing Node.js scripts or lightweight tools if any implementation is attempted.
- **No runtime behavior changes:** The priority is stability.

## Next Steps / Roadmap
- [x] Audit total request count and asset sizes.
- [ ] Implement a lightweight minification pass for `js/` files in the `dist/` task.
- [ ] Research RequireJS `r.js` optimizer or modern alternatives (like Vite or esbuild) that can target AMD.
- [ ] Create a manifest for the Service Worker to enable reliable pre-caching of core assets.
