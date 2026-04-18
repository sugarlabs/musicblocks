# Performance Instrumentation in Music Blocks

Music Blocks includes an optional runtime performance instrumentation layer that helps developers understand how programs execute internally.

This feature is primarily intended for **debugging and performance analysis during development**. It is disabled by default and does not affect normal users.

The instrumentation collects a few useful runtime metrics such as execution time, memory usage changes, and interpreter depth.

---

## Enabling Performance Tracking

Performance instrumentation can be enabled in two ways.

### 1. URL Parameter

You can enable performance tracking by adding the following parameter to the URL when launching Music Blocks:

```
?performance=true
```

Example:

```
http://localhost:8000/?performance=true
```

Once enabled, performance statistics will be printed to the browser console when a program finishes executing.

---

### 2. Global Debug Flag

Performance tracking can also be enabled manually from the browser console:

```
window.DEBUG_PERFORMANCE = true
```

This is useful when debugging without restarting the application.

---

## Example Output

When enabled, the console will show output similar to the following:

```
[Performance] Music Blocks Stats:
- Execution Time: 1842ms
- Memory Delta: +2.1MB
- Max Execution Depth: 126
```

These metrics help developers understand how expensive a program execution was and whether changes affect runtime behavior.

---

## Metrics Collected

### Execution Time

The total time required to run the program, measured using `performance.now()` for high precision.

### Memory Delta

The difference in JavaScript heap memory usage before and after execution.

If the browser does not support memory reporting (for example, some privacy-restricted environments), this metric is safely skipped.

### Maximum Execution Depth

Tracks the deepest level reached in the interpreter during program execution.

This can help identify recursive or deeply nested block structures that may impact performance.

---

## Design Principles

The performance instrumentation was implemented with a few guiding goals:

- **No impact on normal users** – instrumentation is disabled by default.
- **Developer-focused visibility** – metrics are printed to the console rather than displayed in the UI.
- **Safe fallbacks** – memory APIs are detected at runtime to avoid crashes in unsupported browsers.
- **Minimal overhead** – when the feature is disabled, it introduces virtually no runtime cost.

---

## Debug Logging

Music Blocks includes a lightweight debug logging utility (`js/utils/debugLog.js`) that replaces raw `console.log()` calls throughout the codebase. In production, all debug log calls become complete **no-ops with zero runtime cost**.

### Why?

Every `console.log()` call in production JavaScript has hidden costs:

- **String allocation** — the browser serializes arguments even when DevTools is closed.
- **Object reference retention** — Chrome and Firefox hold references to logged objects, preventing garbage collection.
- **Console DOM overhead** — each log appends a node to the browser's internal console tree.

### Enabling Debug Logging

Debug logging can be enabled in three ways, checked in the following priority order:

#### 1. URL Parameter

Add `?debug=true` to the URL when launching Music Blocks:

```
http://localhost:8000/?debug=true
```

This mirrors the existing `?performance=true` parameter.

#### 2. localStorage Flag

From the browser console:

```js
localStorage.setItem("MB_DEBUG", "true"); // enable, then reload
localStorage.setItem("MB_DEBUG", "false"); // force-disable, then reload
localStorage.removeItem("MB_DEBUG"); // restore auto-detection
```

#### 3. Automatic Detection

When no flag or URL parameter is set, debug logging is **automatically enabled** on `localhost` and `127.0.0.1` (development environments).

### Example Output

When enabled, debug messages are prefixed with `[MB]`:

```
[MB] ⚡ Idle mode: Throttling to 1 FPS...
[MB] Recording started
[MB] Custom block loaded: myAction
```

### Design Principles

- **Zero cost in production** — the logger resolves to an empty function at load time.
- **No build step required** — detection happens at runtime via an IIFE.
- **Errors and warnings unchanged** — `console.error` and `console.warn` always surface.

---

## Future Improvements

This instrumentation layer is only the first step toward better performance analysis in Music Blocks. Possible future improvements include:

- A visual performance panel for developers
- Block-level execution profiling
- Automated benchmarking in CI
- Historical performance comparison between runs

---

## Notes for Contributors

If you are working on performance-related changes in Music Blocks, enabling this instrumentation can help you quickly evaluate how your changes affect runtime behavior.

Even small improvements in execution time or interpreter depth can significantly improve the experience when running large block programs.
