# Production Build & Performance Strategy Groundwork

**Related Issue:** #5531  
**Purpose:** Investigation and documentation only (no architectural changes)

---

## 1. Introduction & Understanding

This document provides a foundational analysis of the Music Blocks application's current asset loading strategy. The analysis is based on:

- README.md
- CONTRIBUTING.md
- DOCS_MODULE_ARCHITECTURE.md

The goal is to support future performance optimization efforts, especially for:

- Production environments
- Offline-first behavior
- Service worker reliability
- Long-term maintainability

This work strictly follows the constraints outlined in Issue #5531:

- Investigation and documentation only
- No architectural migrations
- No replacement of RequireJS / AMD
- Focus on low-risk incremental improvements

---

## 2. Current State: Production Asset Delivery & Runtime

### 2.1 Build and Runtime Model

Music Blocks currently operates without a distinct production build process.

Development and production environments load assets in essentially the same way.

Key observations:

- No bundling step
- No production minification pipeline
- Assets served individually

---

### 2.2 Application Loading Flow

The application appears to follow a multi-stage bootstrap process:

1. `index.html` loads global scripts and styles.
   - Includes dependencies such as p5.js and jQuery.

2. `js/loader.js` initializes RequireJS configuration.

3. RequireJS resolves AMD modules:
   - Core modules load first (e.g., `activity/activity`)
   - Dependency graph loads asynchronously via individual file requests.

---

### 2.3 Asset Delivery Characteristics

- JavaScript modules are served as many independent files.
- Files appear largely unminified.
- High number of network requests during initial load.

Dependency analysis suggests:

- Some modules (e.g., `musicutils.js`) have very high dependency counts.
- Runtime graph complexity is significant.

---

### 2.4 Existing Build Process

Current npm scripts primarily support development workflows:

- `npm run dev` → Local HTTP server
- `npm run lint` / `npm test` → Quality checks

There is no dedicated web production build pipeline.

The architecture can effectively be described as:

> **"Buildless runtime delivery for web assets."**

---

### 2.5 Service Worker Behavior

The service worker (`sw.js`) supports offline functionality.

Implications of current asset model:

- Must cache many individual files.
- Cache list appears manually maintained.
- Risk of maintenance errors when files change.

---

## 3. Performance & Offline Implications

### 3.1 Network Performance

Challenges include:

- High request overhead due to many individual files.
- Increased latency during initial load.
- Larger transfer sizes from unminified assets.

Even with HTTP/2 multiplexing, many requests introduce measurable overhead.

---

### 3.2 Offline Reliability

Potential issues:

- Manual cache manifest increases fragility.
- Missing entries may break offline startup.
- Numerous small assets reduce caching efficiency.

---

### 3.3 AMD Constraints

Because RequireJS (AMD) manages module loading:

- Simple concatenation-based bundling will fail.
- Dependency resolution order must be preserved.
- Many modern bundlers require architectural changes.

---

## 4. Low-Risk Optimization Strategies

The following are exploratory options aligned with current constraints.

---

### Strategy A — Per-File Minification

#### Approach

- Iterate through `.js` files.
- Minify using a tool such as `terser`.
- Output to a `dist/` directory preserving structure.

#### Compatibility

- Fully compatible with AMD modules.

#### Benefits

- Reduced download size.
- Minimal architectural impact.

#### Downsides

- Does not reduce request count.

#### Risk Level

Low.

---

### Strategy B — Selective Bundling Using r.js (RequireJS Optimizer)

#### Approach

Use RequireJS optimizer to bundle specific stable modules.

Example candidate:

- `js/utils/musicutils.js` and its dependency tree.

#### Compatibility

- Native AMD optimization tool.

#### Benefits

- Reduced number of requests.
- Faster initial loading.

#### Downsides

- Requires new build configuration.
- Service worker manifest must be updated accordingly.

#### Risk Level

Medium.

Automation of cache manifest updates would be strongly recommended.

---

## 5. Summary and Potential Path Forward

Current model introduces performance and maintenance challenges:

- Large number of network requests
- Lack of minification
- Fragile offline caching workflow

Potential incremental path:

1. Implement per-file minification (low risk).
2. Investigate selective AMD-aware bundling via r.js.
3. Document constraints to inform future v4 architectural planning.

Long-term modernization (e.g., Vite/Webpack) should be evaluated only within future architectural redesign discussions.

---

## 6. Metrics and Open Questions

### Suggested Baseline Metrics

These can be gathered via browser DevTools:

- Total request count on initial load
- Total JS download size
- DOMContentLoaded time
- Full page load time

---

### Open Questions

- Is the service worker cache list manually maintained?
- Would introducing r.js as a devDependency be acceptable?
- Should this analysis live as a standalone performance documentation file?

---

## Status

Draft groundwork document intended to support discussion and future planning.
