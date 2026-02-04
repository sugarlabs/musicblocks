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
Audit of current assets (as of Feb 2026):
- **Core Logic (`js/`):** 208 files, ~6.4MB unminified.
- **Libraries (`lib/`):** 39 files, ~6.4MB (some already minified).
- **Total Request Count:** 247+ JS files on a full load.

Offline reliability depends on fewer, predictable assets. 
- **Service workers** work better with bundled or hashed outputs.
- **AMD + raw assets** increase cache complexity because versioning individual files is difficult without a manifest or hashing.
- **Startup time** is affected by the waterfall of script loading in RequireJS, where hundreds of requests must be resolved and executed.

## Proposed Strategy (Groundwork)
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
